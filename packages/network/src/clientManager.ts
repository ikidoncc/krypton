// ─────────────────────────────────────────────────────────────
// Client Manager — sends intentions to host, receives SYNC_STATE
//
// ARCHITECTURE:
//   - Clients NEVER modify game state locally.
//   - All actions are sent as messages to the host.
//   - The host validates, updates state, and sends back SYNC_STATE.
//   - The client only renders whatever SYNC_STATE it receives.
// ─────────────────────────────────────────────────────────────

import type { GameState, Message, Role, Team } from '@krypton/shared';
import type { DataConnection } from 'peerjs';
import { EventEmitter } from './eventEmitter.js';
import type { Peer } from './peer.js';
import { deserializeGameState, log, parseMessage } from './utils.js';

// ── ClientManager Events ──────────────────────────────────────

type ClientManagerEvents = {
  /** Fired every time the host sends a new SYNC_STATE. */
  stateUpdated: GameState;
  /** Fired when a player joins the lobby (before game start). */
  playerJoined: { id: string; name: string };
  /** Fired when a player leaves. */
  playerLeft: { id: string };
  /** Fired when the connection to the host is lost. */
  disconnected: undefined;
  /** Fired when kicked by the host. */
  kicked: string;
  /** Fired on error. */
  error: Error;
};

// ── ClientManager ─────────────────────────────────────────────

export class ClientManager extends EventEmitter<ClientManagerEvents> {
  private latestState: GameState | null = null;
  private readonly peer: Peer;
  private readonly hostConn: DataConnection;
  private readonly localPlayerId: string;

  constructor(peer: Peer, hostConn: DataConnection, localPlayerId: string) {
    super();
    this.peer = peer;
    this.hostConn = hostConn;
    this.localPlayerId = localPlayerId;
    this.setupConnectionListeners();
    log.info(`ClientManager ready. Local peer: ${localPlayerId}`);
  }

  // ── Public API ──────────────────────────────────────────────

  getState(): GameState | null {
    return this.latestState;
  }

  getLocalPlayerId(): string {
    return this.localPlayerId;
  }

  /** Sent right after connecting to introduce ourselves to the host. */
  sendJoinRoom(name: string): void {
    this.send({
      type: 'JOIN_ROOM',
      payload: { name, clientId: this.localPlayerId },
      from: this.peer.id,
    });
  }

  /** Update our team and role selection in the lobby. */
  sendUpdatePlayer(team: Team, role: Role | null): void {
    this.send({ type: 'UPDATE_PLAYER', payload: { team, role }, from: this.localPlayerId });
  }

  /** Host-only: start the game (validated server-side). */
  sendStartGame(): void {
    this.send({ type: 'START_GAME', payload: {}, from: this.localPlayerId });
  }

  /** Spymaster: submit a clue. */
  sendClue(word: string, count: number): void {
    this.send({ type: 'CLUE', payload: { word, count }, from: this.localPlayerId });
  }

  /** Operative: reveal a card. */
  sendRevealCard(cardId: number): void {
    this.send({ type: 'REVEAL_CARD', payload: { cardId }, from: this.localPlayerId });
  }

  /** Operative: end turn voluntarily. */
  sendNextTurn(): void {
    this.send({ type: 'NEXT_TURN', payload: {}, from: this.localPlayerId });
  }

  /** Disconnect cleanly from the host and destroy the peer. */
  destroy(): void {
    this.hostConn.close();
    this.peer.destroy();
    log.info('ClientManager destroyed.');
  }

  // ── Private ─────────────────────────────────────────────────

  private setupConnectionListeners(): void {
    this.hostConn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;
      this.handleMessage(msg);
    });

    this.hostConn.on('close', () => {
      log.warn('Connection to host closed.');
      this.emit('disconnected', undefined);
    });

    this.hostConn.on('error', (err) => {
      log.error('Host connection error:', err);
      this.emit('error', err as Error);
      this.emit('disconnected', undefined);
    });

    this.peer.on('error', (err) => {
      log.error('Peer error:', err);
      this.emit('error', err as Error);
    });
  }

  private handleMessage(msg: Message): void {
    switch (msg.type) {
      case 'SYNC_STATE': {
        const state = deserializeGameState(msg.payload);
        this.latestState = state;
        this.emit('stateUpdated', state);
        break;
      }

      case 'PLAYER_JOINED':
        this.emit('playerJoined', {
          id: msg.payload.player.id,
          name: msg.payload.player.name,
        });
        break;

      case 'PLAYER_LEFT':
        this.emit('playerLeft', { id: msg.payload.id });
        break;

      case 'KICKED':
        this.emit('kicked', msg.payload.reason);
        break;

      case 'GAME_OVER':
        // GAME_OVER is already embedded in the SYNC_STATE phase change,
        // but we keep this for any extra UI notification needs.
        log.info(`Game over! Winner: ${msg.payload.winner}`);
        break;

      default:
        log.warn(`Client received unexpected message type: ${(msg as Message).type}`);
    }
  }

  private send(msg: Message): void {
    if (!this.hostConn.open) {
      log.warn('Tried to send message but connection is not open:', msg.type);
      return;
    }
    try {
      this.hostConn.send(msg);
    } catch (err) {
      log.error('Failed to send message:', err);
    }
  }
}
