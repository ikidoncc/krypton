// ─────────────────────────────────────────────────────────────
// Board generator
// ─────────────────────────────────────────────────────────────

import type { Board, Card, CardColorValue } from '@krypton/shared';
import {
  BOARD_SIZE,
  STARTING_TEAM_CARDS,
  OTHER_TEAM_CARDS,
  NEUTRAL_CARDS,
  ASSASSIN_CARDS,
} from '@krypton/shared';
import { pickWords } from './wordList.js';

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 * Returns the same array reference.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Generates a fresh 5×5 board for a new game.
 *
 * Card color distribution:
 * - 9 cards for the starting team
 * - 8 cards for the other team
 * - 7 neutral cards
 * - 1 assassin card
 *
 * @param startingTeam - Which team goes first (gets 9 cards).
 */
export function generateBoard(startingTeam: 'red' | 'blue'): Board {
  const otherTeam: 'red' | 'blue' = startingTeam === 'red' ? 'blue' : 'red';

  // Build color distribution in order
  const colors: CardColorValue[] = [
    ...Array<CardColorValue>(STARTING_TEAM_CARDS).fill(startingTeam),
    ...Array<CardColorValue>(OTHER_TEAM_CARDS).fill(otherTeam),
    ...Array<CardColorValue>(NEUTRAL_CARDS).fill('neutral'),
    ...Array<CardColorValue>(ASSASSIN_CARDS).fill('assassin'),
  ];

  // Sanity check
  if (colors.length !== BOARD_SIZE) {
    throw new Error(
      `Board color distribution mismatch: expected ${BOARD_SIZE}, got ${colors.length}`,
    );
  }

  // Shuffle colors so the assassin and team cards are in random positions
  shuffle(colors);

  // Pick 25 unique words
  const words = pickWords(BOARD_SIZE);

  // Build the board
  const board: Card[] = words.map((word, id): Card => ({
    id,
    word,
    color: colors[id] ?? 'neutral',
    revealed: false,
  }));

  return board as unknown as Board;
}

/**
 * Returns a copy of the board with `color` set to `null`
 * for every card that has not yet been revealed.
 *
 * Use this before broadcasting `SYNC_STATE` to operatives/spectators.
 */
export function maskBoardForOperative(board: Board): Board {
  const masked = (board as Card[]).map((card: Card) => ({
    ...card,
    color: card.revealed ? card.color : null,
  }));
  return masked as unknown as Board;
}
