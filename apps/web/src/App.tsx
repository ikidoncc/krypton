import { GameOverPage } from '@/pages/GameOverPage';
import { GamePage } from '@/pages/GamePage';
import { LobbyPage } from '@/pages/LobbyPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { useGameStore } from '@/store/useGameStore';

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
