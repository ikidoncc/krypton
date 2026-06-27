import { useNetwork } from '@/hooks/useNetwork';
import { useGameStore } from '@/store/useGameStore';
import { BoardComponent } from '@/components/board/BoardComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePeerStore } from '@/store/usePeerStore';

export function GameOverPage() {
  const { leaveRoom } = useNetwork();
  const { gameState, localPlayer } = useGameStore();

  if (!gameState || !localPlayer) return null;

  const { winner, endReason, board } = gameState;

  const winnerLabel = winner === 'red' ? 'Time Vermelho' : 'Time Azul';
  const winnerColorClass = winner === 'red' ? 'text-[var(--color-team-red)]' : 'text-[var(--color-team-blue)]';

  const handlePlayAgain = () => {
    // Only the host can restart the game back to lobby phase
    if (localPlayer.isHost) {
      const { hostManager } = usePeerStore.getState();
      if (hostManager) {
        hostManager.dispatch({
          type: 'SET_PHASE',
          payload: { phase: 'lobby' },
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-krypton-bg)] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 items-center">
        {/* Victory Announcement */}
        <Card className="w-full max-w-2xl text-center border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)] shadow-2xl">
          <CardHeader className="pt-8">
            <div className="text-4xl mb-2">🏆</div>
            <CardTitle className="text-3xl font-black uppercase tracking-widest">
              Vitória do <span className={winnerColorClass}>{winnerLabel}</span>!
            </CardTitle>
            <CardDescription className="text-[var(--color-krypton-muted)] text-sm pt-2">
              {endReason === 'assassin' ? (
                <span className="text-red-400 font-medium">
                  ☠ O time oposto revelou o assassino!
                </span>
              ) : (
                <span>Todas as palavras secretas foram identificadas!</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 flex justify-center gap-4">
            {localPlayer.isHost ? (
              <Button
                id="play-again-btn"
                onClick={handlePlayAgain}
                className="bg-[var(--color-team-blue)] text-white hover:brightness-110 font-bold px-6 py-5"
              >
                Jogar Novamente
              </Button>
            ) : (
              <p className="text-sm text-[var(--color-krypton-muted)]">
                Aguardando o host iniciar uma nova partida...
              </p>
            )}
            <Button
              variant="destructive"
              onClick={leaveRoom}
              className="font-bold px-6 py-5"
            >
              Sair da Sala
            </Button>
          </CardContent>
        </Card>

        {/* Revealed Board */}
        <div className="w-full space-y-3">
          <h2 className="text-center text-lg font-bold text-[var(--color-krypton-muted)] uppercase tracking-wider">
            Tabuleiro Revelado
          </h2>
          {/* Note: since phase is gameover, spymaster is set to true so everyone sees the full colors! */}
          <BoardComponent
            board={board}
            localPlayer={{ ...localPlayer, role: 'spymaster' }}
            currentTeam="red"
            turnPhase="end_turn"
            onRevealCard={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
