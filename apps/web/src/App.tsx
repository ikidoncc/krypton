import { useGameStore } from '@/store/useGameStore';
import { LobbyPage } from '@/pages/LobbyPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { GamePage } from '@/pages/GamePage';
import { GameOverPage } from '@/pages/GameOverPage';

export default function App() {
  const { gameState } = useGameStore();

  if (!gameState) {
    return <LobbyPage />;
  }

  switch (gameState.phase) {
    case 'lobby':
      return <LobbyPage />;
    case 'teams':
      return <TeamsPage />;
    case 'playing':
      return <GamePage />;
    case 'gameover':
      return <GameOverPage />;
    default:
      return <LobbyPage />;
  }
}
