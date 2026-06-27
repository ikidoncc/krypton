// ─────────────────────────────────────────────────────────────
// Game Reducer — pure (state, action) => state
//
// RULE: This function MUST remain pure. No side effects,
//       no network calls, no randomness except via injected deps.
//       The host calls this on every incoming player intention.
// ─────────────────────────────────────────────────────────────

import type { Card, GameState, Player, Role, Team } from '@krypton/shared';
import { OTHER_TEAM_CARDS, STARTING_TEAM_CARDS } from '@krypton/shared';
import { generateBoard } from './boardGenerator.js';
import { selectStartingTeam } from './teamGenerator.js';
import { canEndTurn, canGiveClue, canRevealCard, isGameOver } from './validators.js';

export type EngineAction =
  | { type: 'ADD_PLAYER'; payload: { player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { id: string } }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; team: Team; role: Role | null } }
  | { type: 'START_GAME'; payload?: { startingTeam?: 'red' | 'blue' } }
  | { type: 'GIVE_CLUE'; payload: { playerId: string; word: string; count: number } }
  | { type: 'REVEAL_CARD'; payload: { playerId: string; cardId: number } }
  | { type: 'NEXT_TURN'; payload: { playerId: string } }
  | { type: 'SET_PHASE'; payload: { phase: GameState['phase'] } };

// ── Helpers ───────────────────────────────────────────────────

function findPlayer(state: GameState, id: string): Player | undefined {
  return state.players.find((p: Player) => p.id === id);
}

function nextTeam(team: 'red' | 'blue'): 'red' | 'blue' {
  return team === 'red' ? 'blue' : 'red';
}

/**
 * Calculates remaining cards for each team based on current board state.
 * Used to initialise `remainingCards` when a game starts.
 */
function calcRemainingCards(
  _board: GameState['board'],
  startingTeam: 'red' | 'blue',
): { red: number; blue: number } {
  const starting = STARTING_TEAM_CARDS; // 9
  const other = OTHER_TEAM_CARDS; // 8
  return {
    red: startingTeam === 'red' ? starting : other,
    blue: startingTeam === 'blue' ? starting : other,
  };
}

// ── Reducer ───────────────────────────────────────────────────

/**
 * The central game reducer.
 * Returns a new `GameState` — never mutates the input.
 *
 * Invalid actions are silently ignored (return the same state reference).
 * The host is responsible for running validators before dispatching.
 */
export function gameReducer(state: GameState, action: EngineAction): GameState {
  switch (action.type) {
    // ── Player management (lobby / teams phase) ─────────────

    case 'ADD_PLAYER': {
      const { player } = action.payload;
      // Avoid duplicates
      if (state.players.some((p: Player) => p.id === player.id)) return state;
      return { ...state, players: [...state.players, player] };
    }

    case 'REMOVE_PLAYER': {
      const { id } = action.payload;
      const players = state.players.filter((p: Player) => p.id !== id);
      // If the host left, promote the first remaining player
      const removedWasHost = state.players.find((p: Player) => p.id === id)?.isHost ?? false;
      const updatedPlayers =
        removedWasHost && players.length > 0
          ? players.map((p: Player, i: number) => (i === 0 ? { ...p, isHost: true } : p))
          : players;
      return { ...state, players: updatedPlayers };
    }

    case 'UPDATE_PLAYER': {
      const { id, team, role } = action.payload;
      const players = state.players.map((p: Player) => (p.id === id ? { ...p, team, role } : p));
      return { ...state, players };
    }

    // ── Game start ──────────────────────────────────────────

    case 'START_GAME': {
      if (state.phase !== 'lobby' && state.phase !== 'teams') return state;

      const startingTeam = action.payload?.startingTeam ?? selectStartingTeam();
      const board = generateBoard(startingTeam);
      const remainingCards = calcRemainingCards(board, startingTeam);

      return {
        ...state,
        phase: 'playing',
        board,
        currentTeam: startingTeam,
        turnPhase: 'giving_clue',
        clue: null,
        guessesLeft: 0,
        remainingCards,
        scores: { red: 0, blue: 0 },
        winner: null,
        endReason: null,
      };
    }

    // ── Give clue ───────────────────────────────────────────

    case 'GIVE_CLUE': {
      const { playerId, word, count } = action.payload;
      const player = findPlayer(state, playerId);
      if (!player || !canGiveClue(state, player)) return state;

      // count = 0 means unlimited guesses (bonus: count + 1)
      const guessesLeft = count === 0 ? Infinity : count + 1;

      return {
        ...state,
        turnPhase: 'guessing',
        clue: { word: word.trim().toUpperCase(), count },
        guessesLeft,
      };
    }

    // ── Reveal card ─────────────────────────────────────────

    case 'REVEAL_CARD': {
      const { playerId, cardId } = action.payload;
      const player = findPlayer(state, playerId);
      if (!player || !canRevealCard(state, player, cardId)) return state;

      // Reveal the card
      const board = (state.board as Card[]).map((card: Card) =>
        card.id === cardId ? { ...card, revealed: true } : card,
      ) as GameState['board'];

      const revealedCard = board[cardId]!;
      const revealedColor = revealedCard.color;

      // Update scores and remainingCards
      const scores = { ...state.scores };
      const remainingCards = { ...state.remainingCards };

      if (revealedColor === 'red' || revealedColor === 'blue') {
        scores[revealedColor] += 1;
        remainingCards[revealedColor] = Math.max(0, remainingCards[revealedColor] - 1);
      }

      const nextState: GameState = {
        ...state,
        board,
        scores,
        remainingCards,
        guessesLeft: state.guessesLeft === Infinity ? Infinity : state.guessesLeft - 1,
      };

      // Check game over
      const gameOver = isGameOver(nextState);
      if (gameOver.over) {
        return {
          ...nextState,
          phase: 'gameover',
          winner: gameOver.winner,
          endReason: gameOver.reason,
          turnPhase: 'end_turn',
        };
      }

      // Wrong team card OR neutral → end turn automatically
      const wrongTeamCard =
        revealedColor !== null &&
        revealedColor !== 'assassin' &&
        revealedColor !== state.currentTeam;

      const outOfGuesses = nextState.guessesLeft !== Infinity && nextState.guessesLeft <= 0;

      if (wrongTeamCard || outOfGuesses) {
        return {
          ...nextState,
          currentTeam: nextTeam(state.currentTeam),
          turnPhase: 'giving_clue',
          clue: null,
          guessesLeft: 0,
        };
      }

      return nextState;
    }

    // ── End turn voluntarily ────────────────────────────────

    case 'NEXT_TURN': {
      const { playerId } = action.payload;
      const player = findPlayer(state, playerId);
      if (!player || !canEndTurn(state, player)) return state;

      return {
        ...state,
        currentTeam: nextTeam(state.currentTeam),
        turnPhase: 'giving_clue',
        clue: null,
        guessesLeft: 0,
      };
    }

    case 'SET_PHASE': {
      const { phase } = action.payload;
      return {
        ...state,
        phase,
      };
    }

    default: {
      // Exhaustive check: TypeScript will warn if a case is missing
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
