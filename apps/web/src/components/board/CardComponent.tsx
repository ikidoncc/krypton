import type { Card, CardColorValue } from '@krypton/shared';

interface CardComponentProps {
  card: Card;
  isSpymaster: boolean;
  isCurrentTeamOperative: boolean;
  onClick?: (cardId: number) => void;
}

const COLOR_CLASSES: Record<CardColorValue, string> = {
  red: 'bg-[var(--color-team-red)] text-white shadow-[0_0_20px_var(--color-team-red-glow)]',
  blue: 'bg-[var(--color-team-blue)] text-white shadow-[0_0_20px_var(--color-team-blue-glow)]',
  neutral: 'bg-[var(--color-card-neutral)] text-[var(--color-krypton-muted)]',
  assassin:
    'bg-[var(--color-card-assassin)] text-red-400 border-[var(--color-card-assassin-border)] shadow-[0_0_20px_rgba(139,0,0,0.4)]',
};

const SPYMASTER_BORDER: Record<CardColorValue, string> = {
  red: 'ring-2 ring-[var(--color-team-red)] ring-offset-1 ring-offset-[var(--color-krypton-bg)]',
  blue: 'ring-2 ring-[var(--color-team-blue)] ring-offset-1 ring-offset-[var(--color-krypton-bg)]',
  neutral: 'ring-1 ring-[var(--color-krypton-border)]',
  assassin: 'ring-2 ring-red-800 ring-offset-1 ring-offset-[var(--color-krypton-bg)]',
};

export function CardComponent({
  card,
  isSpymaster,
  isCurrentTeamOperative,
  onClick,
}: CardComponentProps) {
  const canClick = isCurrentTeamOperative && !card.revealed && !!onClick;
  const color = card.color as CardColorValue | null;

  // Spymaster background hint (before reveal)
  const spymasterBg: Record<CardColorValue, string> = {
    red: 'bg-red-950/60',
    blue: 'bg-blue-950/60',
    neutral: 'bg-[var(--color-krypton-surface)]',
    assassin: 'bg-red-950/80',
  };

  return (
    <div className="relative [perspective:600px] select-none">
      {/* Card container with 3D flip */}
      <div
        className={`
          relative w-full aspect-[4/3] transition-all duration-500
          [transform-style:preserve-3d]
          ${card.revealed ? '[transform:rotateY(180deg)]' : ''}
        `}
      >
        {/* Front face — unrevealed */}
        <button
          type="button"
          disabled={!canClick}
          onClick={canClick ? () => onClick?.(card.id) : undefined}
          className={`
            absolute inset-0 flex items-center justify-center
            rounded-xl border [backface-visibility:hidden]
            transition-all duration-200
            ${isSpymaster && color ? spymasterBg[color] : 'bg-[var(--color-krypton-surface)]'}
            ${isSpymaster && color ? SPYMASTER_BORDER[color] : 'border-[var(--color-krypton-border)]'}
            ${
              canClick
                ? 'cursor-pointer hover:scale-[1.03] hover:brightness-110 active:scale-[0.97]'
                : 'cursor-default'
            }
          `}
        >
          <span
            className="
            text-center font-bold text-xs sm:text-sm leading-tight px-2
            text-[var(--color-krypton-text)] uppercase tracking-wide
          "
          >
            {card.word}
          </span>

          {/* Spymaster color dot */}
          {isSpymaster && color && (
            <span
              className={`
              absolute top-1.5 right-1.5 w-2 h-2 rounded-full
              ${color === 'red' ? 'bg-[var(--color-team-red)]' : ''}
              ${color === 'blue' ? 'bg-[var(--color-team-blue)]' : ''}
              ${color === 'neutral' ? 'bg-[var(--color-krypton-muted)]' : ''}
              ${color === 'assassin' ? 'bg-red-700' : ''}
            `}
            />
          )}
        </button>

        {/* Back face — revealed */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            rounded-xl border [backface-visibility:hidden]
            [transform:rotateY(180deg)]
            ${color ? COLOR_CLASSES[color] : 'bg-[var(--color-card-neutral)]'}
            ${color === 'assassin' ? 'border-[var(--color-card-assassin-border)]' : 'border-transparent'}
          `}
        >
          <span className="text-center font-bold text-xs sm:text-sm leading-tight px-2 uppercase tracking-wide opacity-90">
            {card.word}
          </span>
          {color === 'assassin' && (
            <span className="absolute text-2xl top-1 right-2 opacity-60">☠</span>
          )}
        </div>
      </div>
    </div>
  );
}
