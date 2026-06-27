import type { Board, Player } from '@krypton/shared';
import { CardComponent } from './CardComponent';

interface BoardComponentProps {
  board: Board;
  localPlayer: Player;
  currentTeam: 'red' | 'blue';
  turnPhase: 'giving_clue' | 'guessing' | 'end_turn';
  onRevealCard: (cardId: number) => void;
}

export function BoardComponent({
  board,
  localPlayer,
  currentTeam,
  turnPhase,
  onRevealCard,
}: BoardComponentProps) {
  const isSpymaster = localPlayer.role === 'spymaster';
  const isCurrentTeam = localPlayer.team === currentTeam;
  const isOperativeCanGuess =
    isCurrentTeam && localPlayer.role === 'operative' && turnPhase === 'guessing';

  return (
    <div className="grid gap-2 sm:gap-3 w-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {board.map((card) => (
        <CardComponent
          key={card.id}
          card={card}
          isSpymaster={isSpymaster}
          isCurrentTeamOperative={isOperativeCanGuess}
          onClick={isOperativeCanGuess ? onRevealCard : undefined}
        />
      ))}
    </div>
  );
}
