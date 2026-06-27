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

import type { EngineAction } from '@krypton/engine';
import { canStartGame, gameReducer, maskBoardForOperative } from '@krypton/engine';
import type { GameState, Message, Player, SyncStateMessage } from '@krypton/shared';
import { createInitialGameState, getClientId } from '@krypton/shared';
import type { DataConnection } from 'peerjs';
import { EventEmitter } from './eventEmitter.js';
import type { Peer } from './peer.js';
import { log, parseMessage, peerIdToRoomCode, serializeGameState } from './utils.js';

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

  constructor(peer: Peer, hostName: string) {
    super();
    this.peer = peer;

    // Build the host player
    const hostClientId = getClientId();
    this.hostPlayer = {
      id: hostClientId,
      clientId: hostClientId,
      peerId: peer.id,
      name: hostName,
      team: 'spectator',
      role: null,
      isHost: true,
      connected: true,
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

  /**
   * Kicks a player from the room.
   */
  kickPlayer(playerId: string): void {
    const conn = this.connections.get(playerId);
    if (conn) {
      log.info(`Host kicking player: ${playerId}`);
      try {
        conn.send({
          type: 'KICKED',
          payload: { reason: 'Você foi removido da sala pelo Host.' },
          from: this.peer.id,
        });
      } catch (err) {
        log.error(`Failed to send KICKED message to ${playerId}:`, err);
      }
      conn.close();
      this.handlePlayerLeft(playerId);
    }
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
        this.handleJoinRoom(conn, msg.payload.name, msg.payload.clientId);
        break;

      case 'UPDATE_PLAYER': {
        const player = this.findPlayer(conn.peer);
        if (player) {
          this.applyAndBroadcast({
            type: 'UPDATE_PLAYER',
            payload: { id: player.id, team: msg.payload.team, role: msg.payload.role },
          });
        }
        break;
      }

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

      case 'CLUE': {
        const player = this.findPlayer(conn.peer);
        if (player) {
          this.applyAndBroadcast({
            type: 'GIVE_CLUE',
            payload: {
              playerId: player.id,
              word: msg.payload.word,
              count: msg.payload.count,
            },
          });
        }
        break;
      }

      case 'REVEAL_CARD': {
        const player = this.findPlayer(conn.peer);
        if (player) {
          this.applyAndBroadcast({
            type: 'REVEAL_CARD',
            payload: { playerId: player.id, cardId: msg.payload.cardId },
          });
        }
        break;
      }

      case 'NEXT_TURN': {
        const player = this.findPlayer(conn.peer);
        if (player) {
          this.applyAndBroadcast({
            type: 'NEXT_TURN',
            payload: { playerId: player.id },
          });
        }
        break;
      }

      default:
        log.warn(`Unhandled message type from ${conn.peer}: ${(msg as Message).type}`);
    }
  }

  private handleJoinRoom(conn: DataConnection, name: string, clientId: string): void {
    const existingPlayer = this.state.players.find((p) => p.clientId === clientId);

    if (existingPlayer) {
      log.info(`Player re-connecting: ${name} (clientId: ${clientId}, new peerId: ${conn.peer})`);

      // 1. Close and delete old connection reference if peer ID changed
      const oldPeerId = existingPlayer.peerId;
      if (oldPeerId !== conn.peer) {
        const oldConn = this.connections.get(oldPeerId);
        if (oldConn) {
          try {
            oldConn.close();
          } catch {}
          this.connections.delete(oldPeerId);
        }
      }

      // Update mapped connection
      this.connections.set(conn.peer, conn);

      // Build updated player instance
      const reconnectedPlayer: Player = {
        ...existingPlayer,
        peerId: conn.peer,
        name,
        connected: true,
      };

      // 2. Dispatch to engine reducer
      this.applyAndBroadcast({
        type: 'ADD_PLAYER',
        payload: { player: reconnectedPlayer },
      });

      // 3. Broadcast PLAYER_JOINED
      this.broadcast({
        type: 'PLAYER_JOINED',
        payload: {
          player: reconnectedPlayer,
          players: this.state.players,
        },
        from: this.peer.id,
      });

      this.emit('playerJoined', reconnectedPlayer);
    } else {
      // Create new player
      const newPlayer: Player = {
        id: clientId,
        clientId,
        peerId: conn.peer,
        name,
        team: 'spectator',
        role: null,
        isHost: false,
        connected: true,
      };

      this.connections.set(conn.peer, conn);

      this.applyAndBroadcast({
        type: 'ADD_PLAYER',
        payload: { player: newPlayer },
      });

      this.broadcast({
        type: 'PLAYER_JOINED',
        payload: {
          player: newPlayer,
          players: this.state.players,
        },
        from: this.peer.id,
      });

      this.emit('playerJoined', newPlayer);
      log.info(`Player joined: ${name} (clientId: ${clientId}, peerId: ${conn.peer})`);
    }
  }

  private handlePlayerLeft(peerId: string): void {
    this.connections.delete(peerId);

    const player = this.state.players.find((p) => p.peerId === peerId);
    if (!player) return;

    // Soft disconnect (mark connected = false) instead of delete
    this.applyAndBroadcast({
      type: 'DISCONNECT_PLAYER',
      payload: { id: player.id },
    });

    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { id: player.id },
      from: this.peer.id,
    });

    this.emit('playerLeft', player.id);
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
    return this.state.players.find((p: Player) => p.peerId === peerId);
  }
}
