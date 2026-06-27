// ─────────────────────────────────────────────────────────────
// Player types
// ─────────────────────────────────────────────────────────────

/** Which team a player belongs to. */
export type Team = 'red' | 'blue' | 'spectator';

/** A player's role within their team. Spectators have no role. */
export type Role = 'spymaster' | 'operative';

/** A connected player in the game. */
export interface Player {
  /** Unique identifier (usually Client ID). */
  readonly id: string;
  /** Permanent Client ID identifying the device. */
  readonly clientId: string;
  /** Current connection PeerJS peer ID. */
  peerId: string;
  /** Display name chosen by the player. */
  name: string;
  /** The team this player has joined. */
  team: Team;
  /** The role assigned within the team. Null for spectators. */
  role: Role | null;
  /** Whether this player is the current session host. */
  isHost: boolean;
  /** Whether the player is currently connected. */
  connected: boolean;
}
