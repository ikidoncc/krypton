// ─────────────────────────────────────────────────────────────
// Game state types
// ─────────────────────────────────────────────────────────────

import type { Player, Team } from './player.js';
import type { Board } from './board.js';

// ── Game lifecycle ────────────────────────────────────────────

/**
 * Top-level phases of a Krypton session.
 *
 * ```
 * lobby → teams → playing → gameover
 * ```
 */
export type GamePhase = 'lobby' | 'teams' | 'playing' | 'gameover';

// ── Turn lifecycle (only relevant during `playing`) ──────────

/**
 * Sub-phases within a single team's turn.
 *
 * ```
 * giving_clue → guessing → end_turn → (next team's giving_clue)
 * ```
 */
export type TurnPhase = 'giving_clue' | 'guessing' | 'end_turn';

// ── Active clue ───────────────────────────────────────────────

/** The clue given by the spymaster for the current turn. */
export interface Clue {
  /** The one-word hint. */
  word: string;
  /**
   * Number of cards the clue relates to.
   * A value of `0` means "unlimited guesses" (special rule).
   */
  count: number;
}

// ── Score ─────────────────────────────────────────────────────

export interface Scores {
  red: number;
  blue: number;
}

// ── Full game state ───────────────────────────────────────────

/**
 * The authoritative game state, owned by the Host.
 *
 * IMPORTANT: The host maintains a "full" version (all card colors visible).
 * Before broadcasting to clients, card colors are stripped for operatives/spectators.
 * The `SYNC_STATE` message payload is always a `GameState` — the host
 * is responsible for filtering it per recipient.
 */
export interface GameState {
  /** Current phase of the overall game session. */
  phase: GamePhase;

  /** The 5×5 board of 25 cards. */
  board: Board;

  /** All connected players. */
  players: Player[];

  /**
   * Which team is currently acting.
   * Only meaningful when `phase === 'playing'`.
   */
  currentTeam: Extract<Team, 'red' | 'blue'>;

  /**
   * Sub-phase of the current turn.
   * Only meaningful when `phase === 'playing'`.
   */
  turnPhase: TurnPhase;

  /**
   * The active clue for the current turn, or `null` if not yet given.
   * Only meaningful when `turnPhase === 'guessing'`.
   */
  clue: Clue | null;

  /**
   * How many guesses the current team has left this turn.
   * Starts at `clue.count + 1` (the bonus guess rule).
   */
  guessesLeft: number;

  /**
   * Remaining cards each team still needs to reveal to win.
   * Decremented every time a correct card is revealed.
   */
  remainingCards: Scores;

  /** Total cards revealed per team (for display). */
  scores: Scores;

  /**
   * The winning team, or `null` if the game is still ongoing.
   * Set when `phase === 'gameover'`.
   */
  winner: Extract<Team, 'red' | 'blue'> | null;

  /**
   * How the game ended — only meaningful when `phase === 'gameover'`.
   * - `'cards'`    → team revealed all their cards
   * - `'assassin'` → team revealed the assassin card
   */
  endReason: 'cards' | 'assassin' | null;
}

/**
 * Creates a blank initial GameState for the lobby phase.
 * The board and players are empty until the host starts the game.
 */
export function createInitialGameState(): GameState {
  return {
    phase: 'lobby',
    board: [] as unknown as Board, // populated by engine on game start
    players: [],
    currentTeam: 'red',
    turnPhase: 'giving_clue',
    clue: null,
    guessesLeft: 0,
    remainingCards: { red: 0, blue: 0 },
    scores: { red: 0, blue: 0 },
    winner: null,
    endReason: null,
  };
}
