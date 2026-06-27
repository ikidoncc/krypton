// ─────────────────────────────────────────────────────────────
// Network utilities
// ─────────────────────────────────────────────────────────────

import type { GameState, Message } from '@krypton/shared';
import { isMessage } from '@krypton/shared';

// ── Room code ─────────────────────────────────────────────────

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
const ROOM_CODE_LENGTH = 6;

/**
 * Generates a cryptographically random 6-character room code.
 * Uses an unambiguous character set to avoid confusion.
 */
export function generateRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  return Array.from(bytes)
    .map((b) => ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length]!)
    .join('');
}

/**
 * Converts a room code into the PeerJS peer ID used by the host.
 */
export function roomCodeToPeerId(code: string): string {
  return `krypton-${code.toUpperCase()}`;
}

/**
 * Extracts the room code from a host's peer ID.
 */
export function peerIdToRoomCode(peerId: string): string {
  return peerId.replace(/^krypton-/, '');
}

// ── JSON serialization ────────────────────────────────────────

/**
 * JSON does not support `Infinity`. The engine uses `Infinity` for
 * "unlimited guesses" (clue count = 0). We encode it as `-1` on the wire.
 */
export function serializeGameState(state: GameState): GameState {
  return {
    ...state,
    guessesLeft: state.guessesLeft === Infinity ? -1 : state.guessesLeft,
  };
}

/**
 * Restores `Infinity` from the `-1` sentinel after JSON deserialization.
 */
export function deserializeGameState(state: GameState): GameState {
  return {
    ...state,
    guessesLeft: state.guessesLeft === -1 ? Infinity : state.guessesLeft,
  };
}

/**
 * Safely serializes a `Message` to a JSON string.
 */
export function serializeMessage(message: Message): string {
  return JSON.stringify(message);
}

/**
 * Safely parses incoming data into a `Message`.
 * Returns `null` if the data is not a valid message.
 */
export function parseMessage(data: unknown): Message | null {
  try {
    const parsed: unknown = typeof data === 'string' ? JSON.parse(data) : data;
    return isMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Logging ───────────────────────────────────────────────────

const LOG_PREFIX = '[krypton/network]';

export const log = {
  info: (msg: string, ...args: unknown[]) => console.info(`${LOG_PREFIX} ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`${LOG_PREFIX} ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${msg}`, ...args),
};
