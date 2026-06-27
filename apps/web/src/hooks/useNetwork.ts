import { useCallback, useState } from 'react';
import type { Team, Role } from '@krypton/shared';
import { HostManager, ClientManager, createRoom, joinRoom } from '@krypton/network';
import { useGameStore } from '@/store/useGameStore';
import { usePeerStore } from '@/store/usePeerStore';

/**
 * Provides all network actions for the current player.
 * Works transparently for both host and client roles.
 */
export function useNetwork() {
  const { setGameState, setLocalPlayer, setRoomCode, setConnecting, setError } = useGameStore();
  const { setHostManager, setClientManager } = usePeerStore();
  const { hostManager, clientManager, role } = usePeerStore();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleError = useCallback((msg: string) => {
    setLocalError(msg);
    setError(msg);
    setConnecting(false);
  }, [setError, setConnecting]);

  // ── Host: Create room ───────────────────────────────────────

  const handleCreateRoom = useCallback(async (name: string) => {
    setConnecting(true);
    setLocalError(null);
    setError(null);

    try {
      const { peer, roomCode } = await createRoom();
      const host = new HostManager(peer, name);

      // Hydrate local player from host state
      const hostState = host.getState();
      const localPlayer = hostState.players.find((p) => p.id === peer.id) ?? {
        id: peer.id,
        name,
        team: 'spectator' as Team,
        role: null,
        isHost: true,
      };

      setLocalPlayer(localPlayer);
      setRoomCode(roomCode);
      setHostManager(host);

      // Listen for state changes from the engine
      host.on('stateChanged', (state) => {
        setGameState(state);
        // Keep localPlayer in sync
        const updated = state.players.find((p) => p.id === peer.id);
        if (updated) setLocalPlayer(updated);
      });

      host.on('error', (err) => handleError(err.message));

      // Trigger initial state sync
      setGameState(hostState);

    } catch (err) {
      handleError((err as Error).message ?? 'Erro ao criar sala');
    } finally {
      setConnecting(false);
    }
  }, [setConnecting, setError, setGameState, setLocalPlayer, setRoomCode, setHostManager, handleError]);

  // ── Client: Join room ───────────────────────────────────────

  const handleJoinRoom = useCallback(async (name: string, code: string) => {
    setConnecting(true);
    setLocalError(null);
    setError(null);

    try {
      const { peer, hostConnection } = await joinRoom(code.trim().toUpperCase());
      const client = new ClientManager(peer, hostConnection, peer.id);

      setClientManager(client);

      // Send our name to the host immediately
      client.sendJoinRoom(name);

      // Listen for state updates from the host
      client.on('stateUpdated', (state) => {
        setGameState(state);
        const updated = state.players.find((p) => p.id === peer.id);
        if (updated) setLocalPlayer(updated);
      });

      client.on('disconnected', () => {
        handleError('Desconectado do host.');
      });

      client.on('error', (err) => handleError(err.message));

      setLocalPlayer({
        id: peer.id,
        name,
        team: 'spectator',
        role: null,
        isHost: false,
      });

      setRoomCode(code.trim().toUpperCase());

    } catch (err) {
      handleError((err as Error).message ?? 'Sala não encontrada');
    } finally {
      setConnecting(false);
    }
  }, [setConnecting, setError, setGameState, setLocalPlayer, setRoomCode, setClientManager, handleError]);

  // ── Shared actions (delegate to host or client) ─────────────

  const updatePlayer = useCallback((team: Team, role: Role | null) => {
    if (hostManager) {
      const { localPlayer } = useGameStore.getState();
      if (!localPlayer) return;
      hostManager.dispatch({ type: 'UPDATE_PLAYER', payload: { id: localPlayer.id, team, role } });
    } else {
      clientManager?.sendUpdatePlayer(team, role);
    }
  }, [hostManager, clientManager]);

  const startGame = useCallback(() => {
    if (hostManager) {
      hostManager.dispatch({ type: 'START_GAME' });
    } else {
      clientManager?.sendStartGame();
    }
  }, [hostManager, clientManager]);

  const giveClue = useCallback((word: string, count: number) => {
    const { localPlayer } = useGameStore.getState();
    if (!localPlayer) return;
    if (hostManager) {
      hostManager.dispatch({ type: 'GIVE_CLUE', payload: { playerId: localPlayer.id, word, count } });
    } else {
      clientManager?.sendClue(word, count);
    }
  }, [hostManager, clientManager]);

  const revealCard = useCallback((cardId: number) => {
    const { localPlayer } = useGameStore.getState();
    if (!localPlayer) return;
    if (hostManager) {
      hostManager.dispatch({ type: 'REVEAL_CARD', payload: { playerId: localPlayer.id, cardId } });
    } else {
      clientManager?.sendRevealCard(cardId);
    }
  }, [hostManager, clientManager]);

  const endTurn = useCallback(() => {
    const { localPlayer } = useGameStore.getState();
    if (!localPlayer) return;
    if (hostManager) {
      hostManager.dispatch({ type: 'NEXT_TURN', payload: { playerId: localPlayer.id } });
    } else {
      clientManager?.sendNextTurn();
    }
  }, [hostManager, clientManager]);

  const leaveRoom = useCallback(() => {
    usePeerStore.getState().reset();
    useGameStore.getState().reset();
  }, []);

  return {
    role,
    isHost: role === 'host',
    error: localError,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    updatePlayer,
    startGame,
    giveClue,
    revealCard,
    endTurn,
    leaveRoom,
  };
}
