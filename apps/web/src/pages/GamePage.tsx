import { BoardComponent } from '@/components/board/BoardComponent';
import { PlayerList } from '@/components/shared/PlayerList';
import { RoomCode } from '@/components/shared/RoomCode';
import { CluePanel } from '@/components/turns/CluePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNetwork } from '@/hooks/useNetwork';
import { useGameStore } from '@/store/useGameStore';

export function GamePage() {
  const { giveClue, revealCard, endTurn, leaveRoom } = useNetwork();
  const { gameState, localPlayer, roomCode } = useGameStore();

  if (!gameState || !localPlayer) return null;

  const { board, currentTeam, turnPhase, clue, guessesLeft, remainingCards } = gameState;

  const activeTeamLabel = currentTeam === 'red' ? 'Vermelho' : 'Azul';
  const activeTeamColorClass =
    currentTeam === 'red' ? 'text-[var(--color-team-red)]' : 'text-[var(--color-team-blue)]';

  const isMyTeamTurn = localPlayer.team === currentTeam;
  const myRoleLabel = localPlayer.role === 'spymaster' ? 'Mestre' : 'Operativo';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-krypton-bg)] text-[var(--color-krypton-text)]">
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-wider text-[var(--color-team-blue)]">
              KRYPTON
            </h1>
            <span className="hidden rounded-full bg-[var(--color-krypton-border)] px-2.5 py-0.5 text-xs font-semibold md:inline-block">
              {myRoleLabel} — Time {localPlayer.team === 'red' ? 'Vermelho' : 'Azul'}
            </span>
          </div>

          {/* Scores Tracker */}
          <div className="flex items-center gap-6 rounded-xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-bg)] px-4 py-1.5 font-bold">
            <div className="flex flex-col items-center">
              <span className="text-xxs uppercase tracking-wider text-[var(--color-team-red)]">
                Vermelho
              </span>
              <span className="text-lg text-[var(--color-team-red)]">{remainingCards.red}</span>
            </div>
            <div className="text-xs text-[var(--color-krypton-muted)]">restantes</div>
            <div className="flex flex-col items-center">
              <span className="text-xxs uppercase tracking-wider text-[var(--color-team-blue)]">
                Azul
              </span>
              <span className="text-lg text-[var(--color-team-blue)]">{remainingCards.blue}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {roomCode && <RoomCode code={roomCode} size="sm" />}
            <Button variant="destructive" size="sm" onClick={leaveRoom} className="font-bold">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8 lg:flex-row">
        {/* Left Side: Game Board and Clue Controls */}
        <div className="flex-1 space-y-6">
          {/* Turn Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] p-4">
            <div className="flex items-center gap-3">
              <span className={`relative flex h-3 w-3`}>
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTeam === 'red' ? 'bg-[var(--color-team-red)]' : 'bg-[var(--color-team-blue)]'}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${currentTeam === 'red' ? 'bg-[var(--color-team-red)]' : 'bg-[var(--color-team-blue)]'}`}
                ></span>
              </span>
              <p className="text-sm font-medium">
                Turno do Time{' '}
                <span className={`font-black ${activeTeamColorClass}`}>{activeTeamLabel}</span>
                {isMyTeamTurn ? (
                  <span className="ml-1 text-xs text-emerald-400 font-bold">(Seu Time)</span>
                ) : (
                  <span className="ml-1 text-xs text-[var(--color-krypton-muted)]">
                    (Aguardando)
                  </span>
                )}
              </p>
            </div>
            <div className="text-xs text-[var(--color-krypton-muted)]">
              Fase: {turnPhase === 'giving_clue' ? 'Dando Pista' : 'Adivinhando'}
            </div>
          </div>

          {/* Clue panel interface */}
          <CluePanel
            localPlayer={localPlayer}
            currentTeam={currentTeam}
            turnPhase={turnPhase}
            activeClue={clue}
            guessesLeft={guessesLeft}
            onSubmitClue={giveClue}
            onEndTurn={endTurn}
          />

          {/* 5x5 Card Board */}
          <BoardComponent
            board={board}
            localPlayer={localPlayer}
            currentTeam={currentTeam}
            turnPhase={turnPhase}
            onRevealCard={revealCard}
          />
        </div>

        {/* Right Side: Players Sidebar (hidden on small devices, visible on large) */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <Card className="h-full border-[var(--color-krypton-border)] bg-[var(--color-krypton-surface)] text-[var(--color-krypton-text)]">
            <CardHeader className="pb-3 border-b border-[var(--color-krypton-border)]">
              <CardTitle className="text-base font-bold">Jogadores na Sala</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <PlayerList players={gameState.players} localPlayerId={localPlayer.id} />
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
