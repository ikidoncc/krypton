// @krypton/shared — public API
// This is the single entry point for all shared types.
// Import from here in engine, network, and web packages.

// ── Board ─────────────────────────────────────────────────────
export type { Board, Card, CardColorValue } from './board.js';
export {
  ASSASSIN_CARDS,
  BOARD_SIZE,
  NEUTRAL_CARDS,
  OTHER_TEAM_CARDS,
  STARTING_TEAM_CARDS,
} from './board.js';
// ── Game State ────────────────────────────────────────────────
export type { Clue, GamePhase, GameState, Scores, TurnPhase } from './game.js';
export { createInitialGameState } from './game.js';
// ── Messages ──────────────────────────────────────────────────
export type {
  ClueMessage,
  GameOverMessage,
  JoinRoomMessage,
  Message,
  MessagePayload,
  MessageType,
  NextTurnMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  RevealCardMessage,
  StartGameMessage,
  SyncStateMessage,
  UpdatePlayerMessage,
} from './messages.js';
export { isMessage, MESSAGE_TYPES } from './messages.js';
// ── Player ────────────────────────────────────────────────────
export type { Player, Role, Team } from './player.js';
