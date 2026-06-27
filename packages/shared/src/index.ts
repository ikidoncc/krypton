// @krypton/shared — public API
// This is the single entry point for all shared types.
// Import from here in engine, network, and web packages.

// ── Player ────────────────────────────────────────────────────
export type { Team, Role, Player } from './player.js';

// ── Board ─────────────────────────────────────────────────────
export type { CardColorValue, Card, Board } from './board.js';
export {
  BOARD_SIZE,
  STARTING_TEAM_CARDS,
  OTHER_TEAM_CARDS,
  NEUTRAL_CARDS,
  ASSASSIN_CARDS,
} from './board.js';

// ── Game State ────────────────────────────────────────────────
export type { GamePhase, TurnPhase, Clue, Scores, GameState } from './game.js';
export { createInitialGameState } from './game.js';

// ── Messages ──────────────────────────────────────────────────
export type {
  Message,
  MessageType,
  MessagePayload,
  JoinRoomMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  UpdatePlayerMessage,
  StartGameMessage,
  ClueMessage,
  RevealCardMessage,
  NextTurnMessage,
  SyncStateMessage,
  GameOverMessage,
} from './messages.js';
export { isMessage, MESSAGE_TYPES } from './messages.js';
