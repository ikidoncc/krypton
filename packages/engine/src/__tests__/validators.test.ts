import { describe, it, expect } from 'vitest';
import type { GameState, Player, Board, Card } from '@krypton/shared';
import { createInitialGameState } from '@krypton/shared';
import { canGiveClue, canRevealCard, canEndTurn, canStartGame, isGameOver } from '../validators.js';
import { generateBoard } from '../boardGenerator.js';

// ── Test fixtures ─────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Test',
    team: 'red',
    role: 'operative',
    isHost: false,
    ...overrides,
  };
}

function makePlayingState(overrides: Partial<GameState> = {}): GameState {
  const board = generateBoard('red');
  return {
    ...createInitialGameState(),
    phase: 'playing',
    board,
    currentTeam: 'red',
    turnPhase: 'giving_clue',
    guessesLeft: 0,
    remainingCards: { red: 9, blue: 8 },
    ...overrides,
  };
}

// ── canGiveClue ───────────────────────────────────────────────

describe('canGiveClue', () => {
  it('allows the spymaster of the current team', () => {
    const state = makePlayingState({ turnPhase: 'giving_clue', currentTeam: 'red' });
    const player = makePlayer({ team: 'red', role: 'spymaster' });
    expect(canGiveClue(state, player)).toBe(true);
  });

  it('rejects when not in playing phase', () => {
    const state = makePlayingState({ phase: 'lobby', turnPhase: 'giving_clue' });
    const player = makePlayer({ team: 'red', role: 'spymaster' });
    expect(canGiveClue(state, player)).toBe(false);
  });

  it('rejects when turn phase is not giving_clue', () => {
    const state = makePlayingState({ turnPhase: 'guessing' });
    const player = makePlayer({ team: 'red', role: 'spymaster' });
    expect(canGiveClue(state, player)).toBe(false);
  });

  it('rejects when player is on the wrong team', () => {
    const state = makePlayingState({ turnPhase: 'giving_clue', currentTeam: 'red' });
    const player = makePlayer({ team: 'blue', role: 'spymaster' });
    expect(canGiveClue(state, player)).toBe(false);
  });

  it('rejects when player is an operative', () => {
    const state = makePlayingState({ turnPhase: 'giving_clue' });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canGiveClue(state, player)).toBe(false);
  });
});

// ── canRevealCard ─────────────────────────────────────────────

describe('canRevealCard', () => {
  it('allows an operative of the current team', () => {
    const board = generateBoard('red');
    const state = makePlayingState({ turnPhase: 'guessing', guessesLeft: 3, board });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 0)).toBe(true);
  });

  it('rejects when phase is not playing', () => {
    const state = makePlayingState({ phase: 'gameover', turnPhase: 'guessing', guessesLeft: 1 });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 0)).toBe(false);
  });

  it('rejects when turn phase is giving_clue', () => {
    const state = makePlayingState({ turnPhase: 'giving_clue', guessesLeft: 0 });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 0)).toBe(false);
  });

  it('rejects when no guesses remain', () => {
    const state = makePlayingState({ turnPhase: 'guessing', guessesLeft: 0 });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 0)).toBe(false);
  });

  it('rejects when card is already revealed', () => {
    const board = generateBoard('red');
    const revealedBoard = board.map((c: Card, i: number) => (i === 0 ? { ...c, revealed: true } : c)) as Board;
    const state = makePlayingState({ turnPhase: 'guessing', guessesLeft: 2, board: revealedBoard });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 0)).toBe(false);
  });

  it('rejects when spymaster tries to reveal', () => {
    const state = makePlayingState({ turnPhase: 'guessing', guessesLeft: 2 });
    const player = makePlayer({ team: 'red', role: 'spymaster' });
    expect(canRevealCard(state, player, 0)).toBe(false);
  });

  it('rejects invalid card id', () => {
    const state = makePlayingState({ turnPhase: 'guessing', guessesLeft: 2 });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canRevealCard(state, player, 99)).toBe(false);
  });
});

// ── canEndTurn ────────────────────────────────────────────────

describe('canEndTurn', () => {
  it('allows current team operative during guessing phase', () => {
    const state = makePlayingState({ turnPhase: 'guessing' });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canEndTurn(state, player)).toBe(true);
  });

  it('rejects during giving_clue phase', () => {
    const state = makePlayingState({ turnPhase: 'giving_clue' });
    const player = makePlayer({ team: 'red', role: 'operative' });
    expect(canEndTurn(state, player)).toBe(false);
  });

  it('rejects wrong team', () => {
    const state = makePlayingState({ turnPhase: 'guessing', currentTeam: 'red' });
    const player = makePlayer({ team: 'blue', role: 'operative' });
    expect(canEndTurn(state, player)).toBe(false);
  });
});

// ── canStartGame ──────────────────────────────────────────────

describe('canStartGame', () => {
  it('allows host when teams are valid', () => {
    const players: Player[] = [
      makePlayer({ id: 'h', team: 'red', role: 'spymaster', isHost: true }),
      makePlayer({ id: 'a', team: 'red', role: 'operative' }),
      makePlayer({ id: 'b', team: 'blue', role: 'spymaster' }),
      makePlayer({ id: 'c', team: 'blue', role: 'operative' }),
    ];
    const state = { ...createInitialGameState(), players, phase: 'lobby' as const };
    const host = players[0]!;
    expect(canStartGame(state, host)).toBe(true);
  });

  it('rejects non-host', () => {
    const players: Player[] = [
      makePlayer({ id: 'h', team: 'red', role: 'spymaster', isHost: true }),
      makePlayer({ id: 'a', team: 'red', role: 'operative' }),
      makePlayer({ id: 'b', team: 'blue', role: 'spymaster' }),
      makePlayer({ id: 'c', team: 'blue', role: 'operative' }),
    ];
    const state = { ...createInitialGameState(), players, phase: 'lobby' as const };
    const nonHost = players[1]!;
    expect(canStartGame(state, nonHost)).toBe(false);
  });

  it('rejects when blue team has no spymaster', () => {
    const players: Player[] = [
      makePlayer({ id: 'h', team: 'red', role: 'spymaster', isHost: true }),
      makePlayer({ id: 'a', team: 'red', role: 'operative' }),
      makePlayer({ id: 'b', team: 'blue', role: 'operative' }),
      makePlayer({ id: 'c', team: 'blue', role: 'operative' }),
    ];
    const state = { ...createInitialGameState(), players, phase: 'lobby' as const };
    expect(canStartGame(state, players[0]!)).toBe(false);
  });
});

// ── isGameOver ────────────────────────────────────────────────

describe('isGameOver', () => {
  it('returns not over for a fresh game', () => {
    const board = generateBoard('red');
    const state = makePlayingState({ board, remainingCards: { red: 9, blue: 8 } });
    expect(isGameOver(state).over).toBe(false);
  });

  it('detects assassin reveal — losing team is the current team', () => {
    const board = generateBoard('red');
    const assassinIdx = board.findIndex((c: Card) => c.color === 'assassin');
    const revealedBoard = board.map((c: Card, i: number) =>
      i === assassinIdx ? { ...c, revealed: true } : c,
    ) as Board;
    const state = makePlayingState({
      board: revealedBoard,
      currentTeam: 'red',
      remainingCards: { red: 9, blue: 8 },
    });
    const result = isGameOver(state);
    expect(result.over).toBe(true);
    expect(result.winner).toBe('blue'); // red revealed assassin → blue wins
    expect(result.reason).toBe('assassin');
  });

  it('detects red win when remainingCards.red is 0', () => {
    const state = makePlayingState({ remainingCards: { red: 0, blue: 8 } });
    const result = isGameOver(state);
    expect(result.over).toBe(true);
    expect(result.winner).toBe('red');
    expect(result.reason).toBe('cards');
  });

  it('detects blue win when remainingCards.blue is 0', () => {
    const state = makePlayingState({ remainingCards: { red: 9, blue: 0 } });
    const result = isGameOver(state);
    expect(result.over).toBe(true);
    expect(result.winner).toBe('blue');
    expect(result.reason).toBe('cards');
  });
});
