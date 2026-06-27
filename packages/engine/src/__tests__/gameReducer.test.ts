import type { Board, Card, GameState, Player } from '@krypton/shared';
import { createInitialGameState } from '@krypton/shared';
import { describe, expect, it } from 'vitest';
import { generateBoard } from '../boardGenerator.js';
import { gameReducer } from '../gameReducer.js';

// ── Fixtures ──────────────────────────────────────────────────

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

function makeLobbyState(players: Player[] = []): GameState {
  return { ...createInitialGameState(), players };
}

function makePlayingState(board: Board, overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    board,
    currentTeam: 'red',
    turnPhase: 'giving_clue',
    clue: null,
    guessesLeft: 0,
    remainingCards: { red: 9, blue: 8 },
    scores: { red: 0, blue: 0 },
    players: [],
    ...overrides,
  };
}

// ── ADD_PLAYER ────────────────────────────────────────────────

describe('ADD_PLAYER', () => {
  it('adds a player to the list', () => {
    const state = makeLobbyState();
    const player = makePlayer({ id: 'p1' });
    const next = gameReducer(state, { type: 'ADD_PLAYER', payload: { player } });
    expect(next.players).toHaveLength(1);
    expect(next.players[0]!.id).toBe('p1');
  });

  it('does not add duplicate players', () => {
    const player = makePlayer({ id: 'p1' });
    const state = makeLobbyState([player]);
    const next = gameReducer(state, { type: 'ADD_PLAYER', payload: { player } });
    expect(next.players).toHaveLength(1);
  });
});

// ── REMOVE_PLAYER ─────────────────────────────────────────────

describe('REMOVE_PLAYER', () => {
  it('removes the specified player', () => {
    const p1 = makePlayer({ id: 'p1' });
    const p2 = makePlayer({ id: 'p2' });
    const state = makeLobbyState([p1, p2]);
    const next = gameReducer(state, { type: 'REMOVE_PLAYER', payload: { id: 'p1' } });
    expect(next.players).toHaveLength(1);
    expect(next.players[0]!.id).toBe('p2');
  });

  it('promotes first remaining player to host if host leaves', () => {
    const host = makePlayer({ id: 'host', isHost: true });
    const other = makePlayer({ id: 'other', isHost: false });
    const state = makeLobbyState([host, other]);
    const next = gameReducer(state, { type: 'REMOVE_PLAYER', payload: { id: 'host' } });
    expect(next.players[0]!.isHost).toBe(true);
  });
});

// ── UPDATE_PLAYER ─────────────────────────────────────────────

describe('UPDATE_PLAYER', () => {
  it('updates team and role', () => {
    const p = makePlayer({ id: 'p1', team: 'spectator', role: null });
    const state = makeLobbyState([p]);
    const next = gameReducer(state, {
      type: 'UPDATE_PLAYER',
      payload: { id: 'p1', team: 'blue', role: 'spymaster' },
    });
    expect(next.players[0]!.team).toBe('blue');
    expect(next.players[0]!.role).toBe('spymaster');
  });
});

// ── START_GAME ────────────────────────────────────────────────

describe('START_GAME', () => {
  it('transitions to playing phase', () => {
    const state = makeLobbyState();
    const next = gameReducer(state, {
      type: 'START_GAME',
      payload: { startingTeam: 'red' },
    });
    expect(next.phase).toBe('playing');
  });

  it('generates a 25-card board', () => {
    const state = makeLobbyState();
    const next = gameReducer(state, {
      type: 'START_GAME',
      payload: { startingTeam: 'red' },
    });
    expect(next.board).toHaveLength(25);
  });

  it('sets remainingCards correctly for starting team red', () => {
    const state = makeLobbyState();
    const next = gameReducer(state, {
      type: 'START_GAME',
      payload: { startingTeam: 'red' },
    });
    expect(next.remainingCards.red).toBe(9);
    expect(next.remainingCards.blue).toBe(8);
  });

  it('sets currentTeam to the starting team', () => {
    const state = makeLobbyState();
    const next = gameReducer(state, {
      type: 'START_GAME',
      payload: { startingTeam: 'blue' },
    });
    expect(next.currentTeam).toBe('blue');
  });

  it('ignores START_GAME during playing phase', () => {
    const board = generateBoard('red');
    const state = makePlayingState(board);
    const next = gameReducer(state, { type: 'START_GAME' });
    expect(next).toBe(state); // same reference = no change
  });
});

// ── GIVE_CLUE ─────────────────────────────────────────────────

describe('GIVE_CLUE', () => {
  it('transitions to guessing phase', () => {
    const board = generateBoard('red');
    const spymaster = makePlayer({ id: 'spy', team: 'red', role: 'spymaster' });
    const state = makePlayingState(board, {
      players: [spymaster],
      turnPhase: 'giving_clue',
    });
    const next = gameReducer(state, {
      type: 'GIVE_CLUE',
      payload: { playerId: 'spy', word: 'animal', count: 2 },
    });
    expect(next.turnPhase).toBe('guessing');
    expect(next.clue).toEqual({ word: 'ANIMAL', count: 2 });
    expect(next.guessesLeft).toBe(3); // count + 1
  });

  it('uppercases the clue word', () => {
    const board = generateBoard('red');
    const spy = makePlayer({ id: 'spy', team: 'red', role: 'spymaster' });
    const state = makePlayingState(board, { players: [spy], turnPhase: 'giving_clue' });
    const next = gameReducer(state, {
      type: 'GIVE_CLUE',
      payload: { playerId: 'spy', word: 'floresta', count: 1 },
    });
    expect(next.clue?.word).toBe('FLORESTA');
  });

  it('ignores clue from wrong player', () => {
    const board = generateBoard('red');
    const operative = makePlayer({ id: 'op', team: 'red', role: 'operative' });
    const state = makePlayingState(board, { players: [operative], turnPhase: 'giving_clue' });
    const next = gameReducer(state, {
      type: 'GIVE_CLUE',
      payload: { playerId: 'op', word: 'water', count: 1 },
    });
    expect(next).toBe(state);
  });
});

// ── REVEAL_CARD ───────────────────────────────────────────────

describe('REVEAL_CARD', () => {
  function setupGuessingState(startingTeam: 'red' | 'blue' = 'red') {
    const board = generateBoard(startingTeam);
    const operative = makePlayer({ id: 'op', team: startingTeam, role: 'operative' });
    const spy = makePlayer({ id: 'spy', team: startingTeam, role: 'spymaster' });
    const state = makePlayingState(board, {
      players: [operative, spy],
      turnPhase: 'guessing',
      guessesLeft: 3,
      currentTeam: startingTeam,
      remainingCards: { red: 9, blue: 8 },
    });
    return { state, board, operative };
  }

  it('reveals a card', () => {
    const { state, operative } = setupGuessingState('red');
    const cardIdx = state.board.findIndex((c) => !c.revealed);
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: cardIdx },
    });
    expect(next.board[cardIdx]!.revealed).toBe(true);
  });

  it('decrements guessesLeft when correct team card is revealed', () => {
    const { state, operative } = setupGuessingState('red');
    const correctCardIdx = state.board.findIndex((c) => c.color === 'red' && !c.revealed);
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: correctCardIdx },
    });
    expect(next.guessesLeft).toBe(state.guessesLeft - 1);
  });

  it('ends turn automatically when wrong team card is revealed', () => {
    const { state, operative } = setupGuessingState('red');
    const wrongCardIdx = state.board.findIndex((c: Card) => c.color === 'blue' && !c.revealed);
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: wrongCardIdx },
    });
    expect(next.currentTeam).toBe('blue');
    expect(next.turnPhase).toBe('giving_clue');
  });

  it('ends turn automatically when neutral card is revealed', () => {
    const { state, operative } = setupGuessingState('red');
    const neutralIdx = state.board.findIndex((c: Card) => c.color === 'neutral' && !c.revealed);
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: neutralIdx },
    });
    expect(next.currentTeam).toBe('blue');
    expect(next.turnPhase).toBe('giving_clue');
  });

  it('triggers game over when assassin is revealed', () => {
    const { state, operative } = setupGuessingState('red');
    const assassinIdx = state.board.findIndex((c: Card) => c.color === 'assassin' && !c.revealed);
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: assassinIdx },
    });
    expect(next.phase).toBe('gameover');
    expect(next.winner).toBe('blue'); // red revealed assassin
    expect(next.endReason).toBe('assassin');
  });

  it('triggers game over when all cards of a team are revealed', () => {
    const { state, operative } = setupGuessingState('red');
    // Only 1 red card remaining
    const stateWithOneLeft = {
      ...state,
      guessesLeft: 5,
      remainingCards: { red: 1, blue: 8 },
    };
    const lastRedIdx = stateWithOneLeft.board.findIndex(
      (c: Card) => c.color === 'red' && !c.revealed,
    );
    const next = gameReducer(stateWithOneLeft, {
      type: 'REVEAL_CARD',
      payload: { playerId: operative.id, cardId: lastRedIdx },
    });
    expect(next.phase).toBe('gameover');
    expect(next.winner).toBe('red');
    expect(next.endReason).toBe('cards');
  });

  it('ignores reveal from wrong player', () => {
    const { state } = setupGuessingState('red');
    const next = gameReducer(state, {
      type: 'REVEAL_CARD',
      payload: { playerId: 'nonexistent', cardId: 0 },
    });
    expect(next).toBe(state);
  });
});

// ── NEXT_TURN ─────────────────────────────────────────────────

describe('NEXT_TURN', () => {
  it('switches the active team', () => {
    const board = generateBoard('red');
    const operative = makePlayer({ id: 'op', team: 'red', role: 'operative' });
    const state = makePlayingState(board, {
      players: [operative],
      currentTeam: 'red',
      turnPhase: 'guessing',
    });
    const next = gameReducer(state, { type: 'NEXT_TURN', payload: { playerId: 'op' } });
    expect(next.currentTeam).toBe('blue');
    expect(next.turnPhase).toBe('giving_clue');
    expect(next.clue).toBeNull();
    expect(next.guessesLeft).toBe(0);
  });

  it('ignores NEXT_TURN during giving_clue phase', () => {
    const board = generateBoard('red');
    const operative = makePlayer({ id: 'op', team: 'red', role: 'operative' });
    const state = makePlayingState(board, {
      players: [operative],
      turnPhase: 'giving_clue',
    });
    const next = gameReducer(state, { type: 'NEXT_TURN', payload: { playerId: 'op' } });
    expect(next).toBe(state);
  });
});
