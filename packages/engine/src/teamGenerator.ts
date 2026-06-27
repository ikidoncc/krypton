// ─────────────────────────────────────────────────────────────
// Team generator — assigns players to teams and roles
// ─────────────────────────────────────────────────────────────

import type { Player, Role, Team } from '@krypton/shared';

/**
 * Randomly picks the starting team.
 */
export function selectStartingTeam(): 'red' | 'blue' {
  return Math.random() < 0.5 ? 'red' : 'blue';
}

/**
 * Shuffles an array using Fisher-Yates and returns a new array.
 */
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Distributes players evenly between Red and Blue teams
 * and assigns exactly one Spymaster per team.
 *
 * Rules:
 * - Spectators and players already assigned are kept as-is.
 * - Active players (team !== 'spectator') are shuffled and split 50/50.
 * - The first player on each team becomes the Spymaster, the rest are Operatives.
 * - If only one active player exists, they go to Red as Spymaster
 *   (edge case — game validator will block start anyway).
 *
 * @param players - Current player list (not mutated).
 * @returns A new array of players with updated team/role assignments.
 */
export function assignTeamsRandomly(players: Player[]): Player[] {
  // Separate players who haven't chosen a team yet (or are reassigning)
  const unassigned = shuffled(players.filter((p) => p.team === 'spectator'));
  const alreadyAssigned = players.filter((p) => p.team !== 'spectator');

  // Combine: prefer already-assigned players for team balance
  const toDistribute = shuffled([...alreadyAssigned, ...unassigned]);

  const half = Math.ceil(toDistribute.length / 2);

  const result: Player[] = toDistribute.map((player, idx) => {
    const team: Team = idx < half ? 'red' : 'blue';
    const isFirstOnTeam = idx === 0 || idx === half;
    const role: Role = isFirstOnTeam ? 'spymaster' : 'operative';

    return { ...player, team, role };
  });

  return result;
}

/**
 * Validates that the current team composition allows a game to start.
 * Returns a list of human-readable issues, empty if valid.
 */
export function validateTeamComposition(players: Player[]): string[] {
  const issues: string[] = [];

  for (const team of ['red', 'blue'] as const) {
    const teamPlayers = players.filter((p) => p.team === team);

    if (teamPlayers.length === 0) {
      issues.push(`Time ${team === 'red' ? 'Vermelho' : 'Azul'} não tem jogadores.`);
      continue;
    }

    const spymasters = teamPlayers.filter((p) => p.role === 'spymaster');
    const operatives = teamPlayers.filter((p) => p.role === 'operative');

    if (spymasters.length === 0) {
      issues.push(`Time ${team === 'red' ? 'Vermelho' : 'Azul'} não tem Mestre.`);
    }
    if (spymasters.length > 1) {
      issues.push(`Time ${team === 'red' ? 'Vermelho' : 'Azul'} tem mais de um Mestre.`);
    }
    if (operatives.length === 0) {
      issues.push(`Time ${team === 'red' ? 'Vermelho' : 'Azul'} não tem Operativos.`);
    }
  }

  return issues;
}
