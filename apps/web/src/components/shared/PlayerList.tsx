import type { Player } from '@krypton/shared';

interface PlayerListProps {
  players: Player[];
  localPlayerId: string;
  compact?: boolean;
  onKick?: (playerId: string) => void;
}

const TEAM_LABELS = {
  red: 'Vermelho',
  blue: 'Azul',
  spectator: 'Espectador',
} as const;

const ROLE_LABELS = {
  spymaster: 'Mestre',
  operative: 'Operativo',
} as const;

function PlayerAvatar({ name, team }: { name: string; team: Player['team'] }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = {
    red: 'bg-[var(--color-team-red-dim)] text-[var(--color-team-red)] border-[var(--color-team-red)]',
    blue: 'bg-[var(--color-team-blue-dim)] text-[var(--color-team-blue)] border-[var(--color-team-blue)]',
    spectator:
      'bg-[var(--color-krypton-surface)] text-[var(--color-krypton-muted)] border-[var(--color-krypton-border)]',
  };

  return (
    <div
      className={`
      w-8 h-8 rounded-full border flex items-center justify-center
      text-sm font-bold flex-shrink-0 ${colors[team]}
    `}
    >
      {initial}
    </div>
  );
}

export function PlayerList({ players, localPlayerId, compact = false, onKick }: PlayerListProps) {
  const isLocalPlayerHost = players.find((p) => p.id === localPlayerId)?.isHost ?? false;

  const teams = {
    red: players.filter((p) => p.team === 'red'),
    blue: players.filter((p) => p.team === 'blue'),
    spectator: players.filter((p) => p.team === 'spectator'),
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <PlayerAvatar name={player.name} team={player.team} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-krypton-text)] truncate">
                {player.name}
                {player.id === localPlayerId && (
                  <span className="ml-1 text-xs text-[var(--color-krypton-muted)]">(você)</span>
                )}
              </p>
              {player.role && (
                <p className="text-xs text-[var(--color-krypton-muted)]">
                  {ROLE_LABELS[player.role]}
                </p>
              )}
            </div>
            {player.isHost && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Host
              </span>
            )}
            {isLocalPlayerHost && player.id !== localPlayerId && onKick && (
              <button
                type="button"
                onClick={() => onKick(player.id)}
                className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
                title="Remover jogador"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(['red', 'blue', 'spectator'] as const).map((team) => {
        if (teams[team].length === 0) return null;
        return (
          <div key={team}>
            <p
              className={`
              text-xs uppercase tracking-widest font-semibold mb-2
              ${team === 'red' ? 'text-[var(--color-team-red)]' : ''}
              ${team === 'blue' ? 'text-[var(--color-team-blue)]' : ''}
              ${team === 'spectator' ? 'text-[var(--color-krypton-muted)]' : ''}
            `}
            >
              {TEAM_LABELS[team]}
            </p>
            <div className="flex flex-col gap-1">
              {teams[team].map((player) => (
                <div
                  key={player.id}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    border transition-colors
                    ${
                      player.id === localPlayerId
                        ? 'bg-[var(--color-krypton-surface)] border-[var(--color-krypton-border)]'
                        : 'bg-transparent border-transparent'
                    }
                  `}
                >
                  <PlayerAvatar name={player.name} team={player.team} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-krypton-text)] truncate">
                      {player.name}
                      {player.id === localPlayerId && (
                        <span className="ml-1 text-xs text-[var(--color-krypton-muted)]">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-krypton-muted)]">
                      {player.role ? ROLE_LABELS[player.role] : '—'}
                    </p>
                  </div>
                  {player.isHost && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                      Host
                    </span>
                  )}
                  {isLocalPlayerHost && player.id !== localPlayerId && onKick && (
                    <button
                      type="button"
                      onClick={() => onKick(player.id)}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                      title="Remover jogador"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
