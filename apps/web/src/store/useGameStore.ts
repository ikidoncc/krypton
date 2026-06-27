import type { GameState, Player } from '@krypton/shared';
import { create } from 'zustand';

interface GameStore {
  /** The authoritative game state received from the host. */
  gameState: GameState | null;
  /** The local player (our own Player object). */
  localPlayer: Player | null;
  /** The 6-character room code. */
  roomCode: string | null;
  /** True while connecting / creating a room. */
  isConnecting: boolean;
  /** Latest network or validation error. */
  error: string | null;

  // ── Actions ──────────────────────────────────────────────────
  setGameState: (state: GameState) => void;
  setLocalPlayer: (player: Player) => void;
  setRoomCode: (code: string) => void;
  setConnecting: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /** Reset everything — used on "Play Again" or when leaving a room. */
  reset: () => void;
}

const initialState = {
  gameState: null,
  localPlayer: null,
  roomCode: null,
  isConnecting: false,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),
  setLocalPlayer: (localPlayer) => set({ localPlayer }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
