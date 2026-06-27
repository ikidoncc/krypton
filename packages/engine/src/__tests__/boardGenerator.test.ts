import type { Card } from '@krypton/shared';
import { BOARD_SIZE, NEUTRAL_CARDS, OTHER_TEAM_CARDS, STARTING_TEAM_CARDS } from '@krypton/shared';
import { describe, expect, it } from 'vitest';
import { generateBoard, maskBoardForOperative } from '../boardGenerator.js';

describe('generateBoard', () => {
  it('returns exactly 25 cards', () => {
    const board = generateBoard('red');
    expect(board).toHaveLength(BOARD_SIZE);
  });

  it('assigns sequential ids from 0 to 24', () => {
    const board = generateBoard('red');
    board.forEach((card, idx) => {
      expect(card.id).toBe(idx);
    });
  });

  it('all cards start unrevealed', () => {
    const board = generateBoard('red');
    expect(board.every((c) => c.revealed === false)).toBe(true);
  });

  it('all cards have non-empty words', () => {
    const board = generateBoard('red');
    expect(board.every((c) => c.word.length > 0)).toBe(true);
  });

  it('no duplicate words on the board', () => {
    const board = generateBoard('red');
    const words = board.map((c) => c.word);
    expect(new Set(words).size).toBe(BOARD_SIZE);
  });

  it('has correct card distribution when red starts', () => {
    const board = generateBoard('red');
    const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 };
    for (const card of board) {
      if (card.color) counts[card.color]++;
    }
    expect(counts.red).toBe(STARTING_TEAM_CARDS); // 9
    expect(counts.blue).toBe(OTHER_TEAM_CARDS); // 8
    expect(counts.neutral).toBe(NEUTRAL_CARDS); // 7
    expect(counts.assassin).toBe(1);
  });

  it('has correct card distribution when blue starts', () => {
    const board = generateBoard('blue');
    const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 };
    for (const card of board) {
      if (card.color) counts[card.color]++;
    }
    expect(counts.blue).toBe(STARTING_TEAM_CARDS); // 9
    expect(counts.red).toBe(OTHER_TEAM_CARDS); // 8
    expect(counts.neutral).toBe(NEUTRAL_CARDS); // 7
    expect(counts.assassin).toBe(1);
  });

  it('has exactly one assassin', () => {
    const board = generateBoard('red');
    expect(board.filter((c) => c.color === 'assassin')).toHaveLength(1);
  });

  it('produces different boards on consecutive calls (statistical)', () => {
    const a = generateBoard('red')
      .map((c) => c.word)
      .join();
    const b = generateBoard('red')
      .map((c) => c.word)
      .join();
    expect(a).not.toBe(b);
  });
});

describe('maskBoardForOperative', () => {
  it('hides colors of unrevealed cards', () => {
    const board = generateBoard('red');
    const masked = maskBoardForOperative(board);
    const unrevealed = masked.filter((c) => !c.revealed);
    expect(unrevealed.every((c) => c.color === null)).toBe(true);
  });

  it('preserves colors of revealed cards', () => {
    const board = generateBoard('red');
    // Manually reveal first card
    const revealed = board.map((c: Card, i: number) =>
      i === 0 ? { ...c, revealed: true } : c,
    ) as typeof board;
    const masked = maskBoardForOperative(revealed);
    expect(masked[0]!.color).toBe(board[0]!.color);
  });

  it('does not mutate the original board', () => {
    const board = generateBoard('red');
    const originalColors = board.map((c: Card) => c.color);
    maskBoardForOperative(board);
    expect(board.map((c: Card) => c.color)).toEqual(originalColors);
  });
});
