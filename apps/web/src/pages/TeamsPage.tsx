import { assignTeamsRandomly, validateTeamComposition } from '@krypton/engine';
import { PlayerList } from '@/components/shared/PlayerList';
import { RoomCode } from '@/components/shared/RoomCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNetwork } from '@/hooks/useNetwork';
import { useGameStore } from '@/store/useGameStore';
import { usePeerStore } from '@/store/usePeerStore';

export function TeamsPage() {
  const { updatePlayer, startGame, leaveRoom } = useNetwork();
  const { gameState, localPlayer, roomCode } = useGameStore();

  if (!gameState || !localPlayer) return null;

  const validationIssues = validateTeamComposition(gameState.players);
  const canStart = validationIssues.length === 0;

  const handleSelectTeam = (team: 'red' | 'blue' | 'spectator') => {
    // If spectator, role is null, otherwise default to operative
    const role = team === 'spectator' ? null : 'operative';
    updatePlayer(team, role);
  };

  const handleSelectRole = (role: 'spymaster' | 'operative') => {
    if (localPlayer.team === 'spectator') return;
    updatePlayer(localPlayer.team, role);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-krypton-bg)] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] p-6 md:flex-row">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-[var(--color-team-blue)]">
              DIVISÃO DE EQUIPES
            </h1>
            <p className="text-sm text-[var(--color-krypton-muted)]">
              Escolha seu time e seu papel na partida. Cada time precisa de exatamente 1 Mestre.
            </p>
          </div>
          {roomCode && <RoomCode code={roomCode} />}
        </div>

        {/* Selection Area */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Choose Team & Role */}
            <Card className="border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Suas Configurações</CardTitle>
                <CardDescription className="text-[var(--color-krypton-muted)]">
                  Selecione sua equipe e papel abaixo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-krypton-muted)] block">
                    Escolher Equipe
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectTeam('red')}
                      className={`rounded-xl border py-4 text-center font-bold transition-all ${
                        localPlayer.team === 'red'
                          ? 'border-[var(--color-team-red)] bg-[var(--color-team-red-dim)] text-white shadow-[0_0_15px_var(--color-team-red-glow)]'
                          : 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]'
                      }`}
                    >
                      Time Vermelho
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTeam('blue')}
                      className={`rounded-xl border py-4 text-center font-bold transition-all ${
                        localPlayer.team === 'blue'
                          ? 'border-[var(--color-team-blue)] bg-[var(--color-team-blue-dim)] text-white shadow-[0_0_15px_var(--color-team-blue-glow)]'
                          : 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]'
                      }`}
                    >
                      Time Azul
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTeam('spectator')}
                      className={`rounded-xl border py-4 text-center font-bold transition-all ${
                        localPlayer.team === 'spectator'
                          ? 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]'
                          : 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]'
                      }`}
                    >
                      Espectador
                    </button>
                  </div>
                </div>

                {/* Role Buttons (disabled for spectators) */}
                {localPlayer.team !== 'spectator' && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-krypton-muted)] block">
                      Escolher Papel
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectRole('spymaster')}
                        className={`rounded-xl border py-4 text-center font-bold transition-all ${
                          localPlayer.role === 'spymaster'
                            ? 'border-[var(--color-krypton-text)] bg-[var(--color-krypton-surface)] text-white'
                            : 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]'
                        }`}
                      >
                        Mestre (Spymaster)
                        <span className="block text-xxs font-normal opacity-70">
                          Vê todas as cores
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectRole('operative')}
                        className={`rounded-xl border py-4 text-center font-bold transition-all ${
                          localPlayer.role === 'operative'
                            ? 'border-[var(--color-krypton-text)] bg-[var(--color-krypton-surface)] text-white'
                            : 'border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]'
                        }`}
                      >
                        Operativo (Operative)
                        <span className="block text-xxs font-normal opacity-70">
                          Adivinha as palavras
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Team Balance */}
            <Card className="border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Composição das Equipes</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList players={gameState.players} localPlayerId={localPlayer.id} />
              </CardContent>
            </Card>
          </div>

          {/* Action sidebar */}
          <div className="flex flex-col gap-4">
            <Card className="border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status da Sala</CardTitle>
                <CardDescription className="text-[var(--color-krypton-muted)]">
                  Verificando regras de início
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationIssues.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      Requisitos Pendentes:
                    </p>
                    <ul className="list-disc pl-4 text-xs text-[var(--color-krypton-muted)] space-y-1">
                      {validationIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-emerald-400 font-medium">
                    ✓ Equipes prontas! A partida pode ser iniciada.
                  </p>
                )}

                {localPlayer.isHost ? (
                  <div className="space-y-2 pt-2">
                    <Button
                      id="randomize-teams-btn"
                      onClick={() => {
                        const { hostManager } = usePeerStore.getState();
                        if (hostManager) {
                          const shuffledPlayers = assignTeamsRandomly(gameState.players);
                          shuffledPlayers.forEach((p) => {
                            hostManager.dispatch({
                              type: 'UPDATE_PLAYER',
                              payload: { id: p.id, team: p.team, role: p.role },
                            });
                          });
                        }
                      }}
                      variant="ghost"
                      className="w-full"
                    >
                      Aleatorizar Equipes
                    </Button>
                    <Button
                      id="start-game-btn"
                      onClick={startGame}
                      disabled={!canStart}
                      className="w-full bg-[var(--color-team-blue)] text-white hover:brightness-110 font-bold py-6 text-lg disabled:opacity-40"
                    >
                      Iniciar Partida
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2 text-center text-sm text-[var(--color-krypton-muted)]">
                    Aguardando o host iniciar o jogo.
                  </div>
                )}
              </CardContent>
            </Card>

            <Button variant="destructive" onClick={leaveRoom} className="w-full py-6 font-bold">
              Sair da Sala
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
