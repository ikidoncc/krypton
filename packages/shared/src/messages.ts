// ─────────────────────────────────────────────────────────────
// WebRTC message protocol — discriminated union
//
// RULE: Never send raw strings over the wire. Always use
//       the `Message` type from this module.
//
// Each message has:
//   - `type`    → literal string tag (the discriminant)
//   - `payload` → strongly-typed data for that message
//   - `from`    → sender's peer ID (set by the sender)
// ─────────────────────────────────────────────────────────────

import type { Clue, GameState } from './game.js';
import type { Player } from './player.js';

// ── Individual message shapes ─────────────────────────────────

/**
 * Sent by a new client to the host when entering a room.
 * The host responds with `PLAYER_JOINED` broadcast + `SYNC_STATE`.
 */
export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  payload: {
    /** The display name the player chose. */
    name: string;
  };
  from: string;
}

/**
 * Broadcast by the host to all clients when a new player connects.
 */
export interface PlayerJoinedMessage {
  type: 'PLAYER_JOINED';
  payload: {
    player: Player;
    /** Full list of players after the join (for late-joining clients). */
    players: Player[];
  };
  from: string;
}

/**
 * Broadcast by the host when a player disconnects.
 */
export interface PlayerLeftMessage {
  type: 'PLAYER_LEFT';
  payload: {
    /** Peer ID of the player who left. */
    id: string;
  };
  from: string;
}

/**
 * Sent by a client to the host to update their team/role selection.
 * The host validates and broadcasts `SYNC_STATE`.
 */
export interface UpdatePlayerMessage {
  type: 'UPDATE_PLAYER';
  payload: Pick<Player, 'team' | 'role'>;
  from: string;
}

/**
 * Sent by the host to trigger game start.
 * The host generates the board, assigns starting team, and broadcasts `SYNC_STATE`.
 */
export interface StartGameMessage {
  type: 'START_GAME';
  payload: Record<string, never>;
  from: string;
}

/**
 * Sent by the current spymaster to the host with a clue.
 * The host validates, updates state, and broadcasts `SYNC_STATE`.
 */
export interface ClueMessage {
  type: 'CLUE';
  payload: Clue;
  from: string;
}

/**
 * Sent by an operative to the host requesting a card reveal.
 * The host validates turn/team/phase before applying.
 */
export interface RevealCardMessage {
  type: 'REVEAL_CARD';
  payload: {
    /** Zero-based card index (0–24). */
    cardId: number;
  };
  from: string;
}

/**
 * Sent by an operative to the host to voluntarily end their turn early.
 */
export interface NextTurnMessage {
  type: 'NEXT_TURN';
  payload: Record<string, never>;
  from: string;
}

/**
 * Broadcast by the host to all clients after any state change.
 * The host filters card colors before sending:
 * - Spymasters → receive full colors
 * - Operatives / Spectators → `color` is `null` for unrevealed cards
 */
export interface SyncStateMessage {
  type: 'SYNC_STATE';
  payload: GameState;
  from: string;
}

/**
 * Broadcast by the host when the game ends.
 */
export interface GameOverMessage {
  type: 'GAME_OVER';
  payload: {
    winner: 'red' | 'blue';
    reason: 'cards' | 'assassin';
  };
  from: string;
}

/**
 * Sent by the host to a client to inform them they have been kicked.
 */
export interface KickedMessage {
  type: 'KICKED';
  payload: {
    reason: string;
  };
  from: string;
}

// ── Discriminated union of ALL messages ───────────────────────

export type Message =
  | JoinRoomMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | UpdatePlayerMessage
  | StartGameMessage
  | ClueMessage
  | RevealCardMessage
  | NextTurnMessage
  | SyncStateMessage
  | GameOverMessage
  | KickedMessage;

/** Infer the payload type for a specific message type. */
export type MessagePayload<T extends Message['type']> = Extract<Message, { type: T }>['payload'];

/** All valid message type strings. */
export type MessageType = Message['type'];

// ── Type guard ────────────────────────────────────────────────

/**
 * Runtime type guard to safely parse an incoming WebRTC message.
 * Use this when deserializing JSON from a peer connection.
 *
 * @example
 * const raw = JSON.parse(data);
 * if (isMessage(raw)) { handleMessage(raw); }
 */
export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Record<string, unknown>).type === 'string' &&
    'from' in value &&
    typeof (value as Record<string, unknown>).from === 'string' &&
    'payload' in value
  );
}

/** All valid message type literals — useful for exhaustive checks. */
export const MESSAGE_TYPES = [
  'JOIN_ROOM',
  'PLAYER_JOINED',
  'PLAYER_LEFT',
  'UPDATE_PLAYER',
  'START_GAME',
  'CLUE',
  'REVEAL_CARD',
  'NEXT_TURN',
  'SYNC_STATE',
  'GAME_OVER',
  'KICKED',
] as const satisfies MessageType[];
