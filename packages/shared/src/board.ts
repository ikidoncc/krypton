// ─────────────────────────────────────────────────────────────
// Board / Card types
// ─────────────────────────────────────────────────────────────

/**
 * The hidden color of a card on the board.
 * - `red` / `blue`  → belong to the respective team
 * - `neutral`       → neither team; safe to reveal
 * - `assassin`      → instantly loses the game for the team that reveals it
 */
export type CardColorValue = 'red' | 'blue' | 'neutral' | 'assassin';

/**
 * A single card on the 5×5 board.
 * The `color` field is always present in the host's state but
 * is stripped from the `SYNC_STATE` sent to non-spymaster clients.
 */
export interface Card {
  /** Zero-based index (0–24) identifying position on the board. */
  readonly id: number;
  /** The word displayed on the card face. */
  word: string;
  /**
   * The card's secret color.
   * Operatives and spectators receive `null` for unrevealed cards.
   * Spymasters and the host always receive the real color.
   */
  color: CardColorValue | null;
  /** Whether this card has been flipped/revealed. */
  revealed: boolean;
}

/**
 * The full 5×5 board — always exactly 25 cards.
 * The tuple type enforces this at compile time.
 */
export type Board = [
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
  Card,
];

/** Standard card distribution per game. */
export const BOARD_SIZE = 25 as const;
export const STARTING_TEAM_CARDS = 9 as const;
export const OTHER_TEAM_CARDS = 8 as const;
export const NEUTRAL_CARDS = 7 as const;
export const ASSASSIN_CARDS = 1 as const;
