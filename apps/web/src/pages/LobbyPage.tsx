import { useState } from 'react';
import { PlayerList } from '@/components/shared/PlayerList';
import { RoomCode } from '@/components/shared/RoomCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNetwork } from '@/hooks/useNetwork';
import { useGameStore } from '@/store/useGameStore';
import { usePeerStore } from '@/store/usePeerStore';

export function LobbyPage() {
  const { createRoom, joinRoom, error: networkError, leaveRoom, kickPlayer } = useNetwork();
  const { gameState, roomCode, localPlayer, isConnecting } = useGameStore();

  const [name, setName] = useState(() => localStorage.getItem('krypton_nickname') || '');
  const [code, setCode] = useState(() => localStorage.getItem('krypton_last_room') || '');
  const [hasEnteredName, setHasEnteredName] = useState(
    () => !!localStorage.getItem('krypton_nickname'),
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    localStorage.setItem('krypton_nickname', name.trim());
    await createRoom(name.trim());
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return;
    localStorage.setItem('krypton_nickname', name.trim());
    localStorage.setItem('krypton_last_room', code.trim().toUpperCase());
    await joinRoom(name.trim(), code.trim());
  };

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('krypton_nickname', name.trim());
      setHasEnteredName(true);
    }
  };

  // If the user hasn't entered a name yet, show the name input screen
  if (!hasEnteredName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-krypton-bg)] p-4">
        <Card className="w-full max-w-md border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)] shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold tracking-wider text-[var(--color-team-blue)]">
              KRYPTON
            </CardTitle>
            <CardDescription className="text-[var(--color-krypton-muted)]">
              Digite seu apelido para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetName} className="space-y-4">
              <div className="space-y-2">
                <input
                  id="nickname-input"
                  type="text"
                  placeholder="Seu apelido..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={15}
                  required
                  className="w-full rounded-lg border border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] px-4 py-3 text-lg text-[var(--color-krypton-text)] placeholder-[var(--color-krypton-muted)] outline-none focus:border-[var(--color-team-blue)] focus:ring-1 focus:ring-[var(--color-team-blue)]"
                />
              </div>
              <Button
                type="submit"
                id="next-name-btn"
                className="w-full bg-[var(--color-team-blue)] py-6 text-lg font-bold text-white hover:brightness-110"
              >
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If in a room (waiting for host to start/move to teams phase)
  if (roomCode && gameState) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-krypton-bg)] p-4 md:p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] p-6 md:flex-row">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-[var(--color-team-blue)]">
                KRYPTON LOBBY
              </h1>
              <p className="text-sm text-[var(--color-krypton-muted)]">
                Aguardando o host avançar para a divisão de times.
              </p>
            </div>
            <RoomCode code={roomCode} />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Jogadores Conectados</CardTitle>
                <CardDescription className="text-[var(--color-krypton-muted)]">
                  {gameState.players.length} jogador(es) na sala
                </CardDescription>
              </CardHeader>
              <CardContent>
                {localPlayer && (
                  <PlayerList
                    players={gameState.players}
                    localPlayerId={localPlayer.id}
                    compact
                    onKick={kickPlayer}
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {localPlayer?.isHost ? (
                <Card className="border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Painel do Host</CardTitle>
                    <CardDescription className="text-[var(--color-krypton-muted)]">
                      Você é o host da partida
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--color-krypton-muted)]">
                      Avançar para a divisão de equipes e definição de papéis.
                    </p>
                    <Button
                      id="go-to-teams-btn"
                      onClick={() => {
                        const { hostManager } = usePeerStore.getState();
                        if (hostManager) {
                          hostManager.dispatch({
                            type: 'SET_PHASE',
                            payload: { phase: 'teams' },
                          });
                        }
                      }}
                      className="w-full bg-[var(--color-team-blue)] text-white hover:brightness-110 font-bold"
                    >
                      Configurar Equipes
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Aguardando...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--color-krypton-muted)]">
                      O Host iniciará a configuração de equipes em breve.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button variant="destructive" onClick={leaveRoom} className="w-full py-6 font-bold">
                Sair da Sala
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Welcome screen (Create or Join)
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-krypton-bg)] p-4">
      <Card className="w-full max-w-lg border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)] shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setHasEnteredName(false)}
              className="text-xs text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]"
            >
              ← Mudar nome ({name})
            </button>
            <span className="text-xs text-[var(--color-team-blue)] font-bold uppercase tracking-widest">
              P2P Multiplayer
            </span>
          </div>
          <CardTitle className="text-4xl font-black tracking-wider text-[var(--color-team-blue)]">
            KRYPTON
          </CardTitle>
          <CardDescription className="text-[var(--color-krypton-muted)]">
            Crie uma nova sala ou conecte-se a uma sala existente usando o código.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {networkError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {networkError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Create Room */}
            <div className="flex flex-col justify-between rounded-xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] p-5">
              <div>
                <h3 className="font-bold text-lg text-[var(--color-krypton-text)] mb-2">
                  Criar Sala
                </h3>
                <p className="text-xs text-[var(--color-krypton-muted)] mb-4">
                  Seja o Host, convide seus amigos e gerencie as equipes.
                </p>
              </div>
              <Button
                id="create-room-btn"
                onClick={handleCreate}
                disabled={isConnecting}
                className="w-full bg-[var(--color-team-blue)] hover:brightness-110 font-bold"
              >
                {isConnecting ? 'Criando...' : 'Criar Sala'}
              </Button>
            </div>

            {/* Join Room */}
            <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] p-5">
              <div>
                <h3 className="font-bold text-lg text-[var(--color-krypton-text)] mb-1">
                  Entrar em Sala
                </h3>
                <p className="text-xs text-[var(--color-krypton-muted)]">
                  Digite o código da sala de 6 caracteres.
                </p>
              </div>
              <input
                id="room-code-input"
                type="text"
                placeholder="Código da Sala"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full rounded-lg border border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] px-3 py-2 text-center text-lg font-mono font-bold text-[var(--color-krypton-text)] placeholder-[var(--color-krypton-muted)] outline-none focus:border-[var(--color-team-blue)]"
              />
              <Button
                id="join-room-btn"
                onClick={handleJoin}
                disabled={isConnecting || code.length !== 6}
                className="w-full bg-[var(--color-krypton-surface)] border border-[var(--color-krypton-border)] text-[var(--color-krypton-text)] hover:bg-[var(--color-krypton-border)] font-bold"
              >
                {isConnecting ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
