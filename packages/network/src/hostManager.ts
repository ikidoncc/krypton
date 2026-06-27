// ─────────────────────────────────────────────────────────────
// Host Manager — authoritative game state + connection routing
//
// ARCHITECTURE:
//   - Only the Host runs this class.
//   - Maintains the FULL game state (all card colors visible).
//   - Applies every player intention through the engine reducer.
//   - Broadcasts a FILTERED SYNC_STATE to each client:
//       · Spymasters → receive full board with colors
//       · Operatives / Spectators → board colors null for unrevealed cards
//
// MESSAGE ROUTING (host receives):
//   JOIN_ROOM      → add player, broadcast PLAYER_JOINED, send SYNC_STATE
//   UPDATE_PLAYER  → update team/role, broadcast SYNC_STATE
//   START_GAME     → validate, run engine, broadcast SYNC_STATE
//   CLUE           → validate, run engine, broadcast SYNC_STATE
//   REVEAL_CARD    → validate, run engine, broadcast SYNC_STATE
//   NEXT_TURN      → validate, run engine, broadcast SYNC_STATE
//   PLAYER_LEFT    → (auto on disconnect) remove player, broadcast
// ─────────────────────────────────────────────────────────────

import type { DataConnection } from 'peerjs';
import type {
  GameState,
  Player,
  Message,
  SyncStateMessage,
} from '@krypton/shared';
import { createInitialGameState } from '@krypton/shared';
import type { Peer } from './peer.js';
import type { EngineAction } from '@krypton/engine';
import { gameReducer, maskBoardForOperative, canStartGame } from '@krypton/engine';
import { EventEmitter } from './eventEmitter.js';
import { parseMessage, serializeGameState, log, peerIdToRoomCode } from './utils.js';

// ── HostManager Events ────────────────────────────────────────

type HostManagerEvents = {
  /** Fired whenever the authoritative game state changes. */
  stateChanged: GameState;
  /** Fired when a player connects. */
  playerJoined: Player;
  /** Fired when a player disconnects. */
  playerLeft: string; // peer ID
  /** Fired on unrecoverable errors. */
  error: Error;
};

// ── HostManager ───────────────────────────────────────────────

export class HostManager extends EventEmitter<HostManagerEvents> {
  private state: GameState;
  private connections = new Map<string, DataConnection>();
  private readonly hostPlayer: Player;
  private readonly peer: Peer;

  constructor(
    peer: Peer,
    hostName: string,
  ) {
    super();
    this.peer = peer;

    // Build the host player
    this.hostPlayer = {
      id: peer.id,
      name: hostName,
      team: 'spectator',
      role: null,
      isHost: true,
    };

    // Bootstrap state with the host already in the player list
    this.state = {
      ...createInitialGameState(),
      players: [this.hostPlayer],
    };

    this.setupPeerListeners();
    log.info(`HostManager ready. Room: ${peerIdToRoomCode(peer.id)}`);
  }

  // ── Public API ──────────────────────────────────────────────

  getState(): GameState {
    return this.state;
  }

  getRoomCode(): string {
    return peerIdToRoomCode(this.peer.id);
  }

  /**
   * Dispatches an action directly (used by the host player themselves,
   * bypassing the network message pathway).
   */
  dispatch(action: EngineAction): void {
    this.applyAndBroadcast(action);
  }

  /**
   * Disconnects all clients and destroys the peer.
   */
  destroy(): void {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.peer.destroy();
    log.info('HostManager destroyed.');
  }

  // ── Private: PeerJS setup ───────────────────────────────────

  private setupPeerListeners(): void {
    this.peer.on('connection', (conn) => {
      log.info(`Incoming connection from: ${conn.peer}`);
      this.handleConnection(conn);
    });

    this.peer.on('error', (err) => {
      log.error('Peer error:', err);
      this.emit('error', err as Error);
    });

    this.peer.on('disconnected', () => {
      log.warn('Peer disconnected from signaling server, attempting reconnect...');
      this.peer.reconnect();
    });
  }

  private handleConnection(conn: DataConnection): void {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      log.info(`Connection open: ${conn.peer}`);
    });

    conn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (!msg) {
        log.warn(`Received invalid message from ${conn.peer}`);
        return;
      }
      this.routeMessage(conn, msg);
    });

    conn.on('close', () => {
      log.info(`Connection closed: ${conn.peer}`);
      this.handlePlayerLeft(conn.peer);
    });

    conn.on('error', (err) => {
      log.error(`Connection error from ${conn.peer}:`, err);
      this.handlePlayerLeft(conn.peer);
    });
  }

  // ── Private: Message routing ────────────────────────────────

  private routeMessage(conn: DataConnection, msg: Message): void {
    switch (msg.type) {
      case 'JOIN_ROOM':
        this.handleJoinRoom(conn, msg.payload.name);
        break;

      case 'UPDATE_PLAYER':
        this.applyAndBroadcast({
          type: 'UPDATE_PLAYER',
          payload: { id: conn.peer, team: msg.payload.team, role: msg.payload.role },
        });
        break;

      case 'START_GAME': {
        const player = this.findPlayer(conn.peer);
        if (!player) return;
        if (!canStartGame(this.state, player)) {
          log.warn(`START_GAME rejected from ${conn.peer} (validation failed)`);
          return;
        }
        this.applyAndBroadcast({ type: 'START_GAME' });
        break;
      }

      case 'CLUE':
        this.applyAndBroadcast({
          type: 'GIVE_CLUE',
          payload: {
            playerId: conn.peer,
            word: msg.payload.word,
            count: msg.payload.count,
          },
        });
        break;

      case 'REVEAL_CARD':
        this.applyAndBroadcast({
          type: 'REVEAL_CARD',
          payload: { playerId: conn.peer, cardId: msg.payload.cardId },
        });
        break;

      case 'NEXT_TURN':
        this.applyAndBroadcast({
          type: 'NEXT_TURN',
          payload: { playerId: conn.peer },
        });
        break;

      default:
        log.warn(`Unhandled message type from ${conn.peer}: ${(msg as Message).type}`);
    }
  }

  private handleJoinRoom(conn: DataConnection, name: string): void {
    const newPlayer: Player = {
      id: conn.peer,
      name,
      team: 'spectator',
      role: null,
      isHost: false,
    };

    // Add player to state
    this.applyAndBroadcast({
      type: 'ADD_PLAYER',
      payload: { player: newPlayer },
    });

    // Broadcast PLAYER_JOINED to all other clients
    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: {
        player: newPlayer,
        players: this.state.players,
      },
      from: this.peer.id,
    });

    this.emit('playerJoined', newPlayer);
    log.info(`Player joined: ${name} (${conn.peer})`);
  }

  private handlePlayerLeft(peerId: string): void {
    this.connections.delete(peerId);

    this.applyAndBroadcast({
      type: 'REMOVE_PLAYER',
      payload: { id: peerId },
    });

    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { id: peerId },
      from: this.peer.id,
    });

    this.emit('playerLeft', peerId);
  }

  // ── Private: Engine + broadcast ─────────────────────────────

  private applyAndBroadcast(action: EngineAction): void {
    const next = gameReducer(this.state, action);
    if (next === this.state) return; // no-op — don't broadcast

    this.state = next;
    this.emit('stateChanged', this.state);
    this.broadcastSyncState();
  }

  private broadcastSyncState(): void {
    // Send to each connected client with appropriate filtering
    for (const [peerId, conn] of this.connections) {
      const player = this.findPlayer(peerId);
      this.sendSyncStateTo(conn, player ?? null);
    }
  }

  /**
   * Sends a SYNC_STATE to one connection.
   * Spymasters receive the full board; everyone else gets a masked board.
   */
  private sendSyncStateTo(conn: DataConnection, player: Player | null): void {
    const isSpymaster = player?.role === 'spymaster';

    const stateToSend: GameState = isSpymaster
      ? this.state
      : { ...this.state, board: maskBoardForOperative(this.state.board) };

    const msg: SyncStateMessage = {
      type: 'SYNC_STATE',
      payload: serializeGameState(stateToSend),
      from: this.peer.id,
    };

    try {
      conn.send(msg);
    } catch (err) {
      log.error(`Failed to send SYNC_STATE to ${conn.peer}:`, err);
    }
  }

  private broadcast(msg: Message): void {
    for (const conn of this.connections.values()) {
      try {
        conn.send(msg);
      } catch (err) {
        log.error(`Failed to broadcast to ${conn.peer}:`, err);
      }
    }
  }

  private findPlayer(peerId: string): Player | undefined {
    return this.state.players.find((p: Player) => p.id === peerId);
  }
}
