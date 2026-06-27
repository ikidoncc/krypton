// ─────────────────────────────────────────────────────────────
// Validators — pure functions that check whether an action
// is currently legal given the game state and the acting player.
// ─────────────────────────────────────────────────────────────

import type { Card, GameState, Player } from '@krypton/shared';

// ── canGiveClue ───────────────────────────────────────────────

/**
 * Returns `true` if `player` is allowed to give a clue right now.
 *
 * Requirements:
 * - Game must be in the `playing` phase
 * - Turn phase must be `giving_clue`
 * - Player must be the spymaster of the current team
 */
export function canGiveClue(state: GameState, player: Player): boolean {
  if (state.phase !== 'playing') return false;
  if (state.turnPhase !== 'giving_clue') return false;
  if (player.team !== state.currentTeam) return false;
  if (player.role !== 'spymaster') return false;
  return true;
}

// ── canRevealCard ─────────────────────────────────────────────

/**
 * Returns `true` if `player` is allowed to reveal the card at `cardId`.
 *
 * Requirements:
 * - Game must be in the `playing` phase
 * - Turn phase must be `guessing`
 * - Player must be an operative of the current team
 * - The card must exist and not yet be revealed
 * - There must be guesses remaining
 */
export function canRevealCard(state: GameState, player: Player, cardId: number): boolean {
  if (state.phase !== 'playing') return false;
  if (state.turnPhase !== 'guessing') return false;
  if (player.team !== state.currentTeam) return false;
  if (player.role !== 'operative') return false;
  if (state.guessesLeft <= 0) return false;

  const card = state.board[cardId];
  if (card === undefined) return false;
  if (card.revealed) return false;

  return true;
}

// ── canEndTurn ────────────────────────────────────────────────

/**
 * Returns `true` if `player` is allowed to voluntarily end the turn.
 *
 * Requirements:
 * - Game must be in the `playing` phase
 * - Turn phase must be `guessing`
 * - Player must be an operative of the current team
 * - At least one guess must have been used (can't end turn before guessing anything)
 */
export function canEndTurn(state: GameState, player: Player): boolean {
  if (state.phase !== 'playing') return false;
  if (state.turnPhase !== 'guessing') return false;
  if (player.team !== state.currentTeam) return false;
  if (player.role !== 'operative') return false;
  return true;
}

// ── canStartGame ──────────────────────────────────────────────

/**
 * Returns `true` if `player` is allowed to start the game.
 *
 * Requirements:
 * - Game must be in `lobby` or `teams` phase
 * - Player must be the host
 * - Each active team (red/blue) must have at least 1 spymaster and 1 operative
 */
export function canStartGame(state: GameState, player: Player): boolean {
  if (state.phase !== 'lobby' && state.phase !== 'teams') return false;
  if (!player.isHost) return false;

  const activePlayers = state.players.filter((p: Player) => p.team === 'red' || p.team === 'blue');

  for (const team of ['red', 'blue'] as const) {
    const teamPlayers = activePlayers.filter((p: Player) => p.team === team);
    const hasSpymaster = teamPlayers.some((p: Player) => p.role === 'spymaster');
    const hasOperative = teamPlayers.some((p: Player) => p.role === 'operative');
    if (!hasSpymaster || !hasOperative) return false;
  }

  return true;
}

// ── isGameOver ────────────────────────────────────────────────

export interface GameOverResult {
  over: boolean;
  winner: 'red' | 'blue' | null;
  reason: 'cards' | 'assassin' | null;
}

/**
 * Determines whether the game has ended and, if so, why.
 *
 * Checked in priority order:
 * 1. Assassin card revealed → the team that revealed it **loses**
 * 2. A team has no remaining cards → that team **wins**
 */
export function isGameOver(state: GameState): GameOverResult {
  // Check for assassin reveal
  const assassinRevealed = state.board.find(
    (card: Card) => card.color === 'assassin' && card.revealed,
  );

  if (assassinRevealed) {
    // The team currently acting revealed the assassin — they lose.
    const losingTeam = state.currentTeam;
    const winner = losingTeam === 'red' ? 'blue' : 'red';
    return { over: true, winner, reason: 'assassin' };
  }

  // Check if a team has revealed all their cards
  if (state.remainingCards.red === 0) {
    return { over: true, winner: 'red', reason: 'cards' };
  }
  if (state.remainingCards.blue === 0) {
    return { over: true, winner: 'blue', reason: 'cards' };
  }

  return { over: false, winner: null, reason: null };
}
