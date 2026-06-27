import { useState } from 'react';
import type { Clue, Player } from '@krypton/shared';
import { Send } from 'lucide-react';

interface CluePanelProps {
  localPlayer: Player;
  currentTeam: 'red' | 'blue';
  turnPhase: 'giving_clue' | 'guessing' | 'end_turn';
  activeClue: Clue | null;
  guessesLeft: number;
  onSubmitClue: (word: string, count: number) => void;
  onEndTurn: () => void;
}

const TEAM_COLOR = {
  red: 'text-[var(--color-team-red)]',
  blue: 'text-[var(--color-team-blue)]',
};

const TEAM_BORDER = {
  red: 'border-[var(--color-team-red)]/40 focus:border-[var(--color-team-red)]',
  blue: 'border-[var(--color-team-blue)]/40 focus:border-[var(--color-team-blue)]',
};

const TEAM_BUTTON = {
  red: 'bg-[var(--color-team-red)] hover:brightness-110 shadow-[0_0_16px_var(--color-team-red-glow)]',
  blue: 'bg-[var(--color-team-blue)] hover:brightness-110 shadow-[0_0_16px_var(--color-team-blue-glow)]',
};

export function CluePanel({
  localPlayer,
  currentTeam,
  turnPhase,
  activeClue,
  guessesLeft,
  onSubmitClue,
  onEndTurn,
}: CluePanelProps) {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);

  const isMyTurn = localPlayer.team === currentTeam;
  const isSpymaster = localPlayer.role === 'spymaster';
  const isOperative = localPlayer.role === 'operative';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueWord.trim()) return;
    onSubmitClue(clueWord.trim(), clueCount);
    setClueWord('');
    setClueCount(1);
  };

  // ── Spymaster: give clue ──────────────────────────────────

  if (isSpymaster && isMyTurn && turnPhase === 'giving_clue') {
    return (
      <form
        onSubmit={handleSubmit}
        className="
          flex items-center gap-3 p-4 rounded-2xl
          bg-[var(--color-krypton-surface)] border border-[var(--color-krypton-border)]
        "
      >
        <div className="flex-1">
          <label className={`text-xs uppercase tracking-widest mb-1 block ${TEAM_COLOR[currentTeam]}`}>
            Sua pista (Mestre)
          </label>
          <input
            id="clue-word-input"
            type="text"
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value)}
            placeholder="Uma palavra..."
            maxLength={30}
            autoFocus
            className={`
              w-full bg-transparent border-b-2 outline-none py-1 text-lg font-bold
              text-[var(--color-krypton-text)] placeholder:text-[var(--color-krypton-muted)]
              transition-colors ${TEAM_BORDER[currentTeam]}
            `}
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs text-[var(--color-krypton-muted)] mb-1">Qtd</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setClueCount((n) => Math.max(0, n - 1))}
              className="w-7 h-7 rounded-lg bg-[var(--color-krypton-border)] hover:bg-[var(--color-krypton-muted)]/30 text-[var(--color-krypton-text)] font-bold text-sm transition-colors"
            >−</button>
            <span className="w-8 text-center font-bold text-[var(--color-krypton-text)]">
              {clueCount === 0 ? '∞' : clueCount}
            </span>
            <button
              type="button"
              onClick={() => setClueCount((n) => Math.min(9, n + 1))}
              className="w-7 h-7 rounded-lg bg-[var(--color-krypton-border)] hover:bg-[var(--color-krypton-muted)]/30 text-[var(--color-krypton-text)] font-bold text-sm transition-colors"
            >+</button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!clueWord.trim()}
          id="submit-clue-btn"
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm
            transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
            ${TEAM_BUTTON[currentTeam]}
          `}
        >
          <Send size={15} />
          Enviar
        </button>
      </form>
    );
  }

  // ── Operative/Waiting: show active clue ───────────────────

  if (activeClue && (turnPhase === 'guessing' || turnPhase === 'giving_clue')) {
    const guessDisplay = guessesLeft === Infinity ? '∞' : guessesLeft;

    return (
      <div className="
        flex items-center justify-between gap-4 p-4 rounded-2xl
        bg-[var(--color-krypton-surface)] border border-[var(--color-krypton-border)]
      ">
        <div>
          <p className={`text-xs uppercase tracking-widest mb-1 ${TEAM_COLOR[currentTeam]}`}>
            Pista ativa
          </p>
          <p className="text-2xl font-extrabold text-[var(--color-krypton-text)] tracking-wide">
            {activeClue.word}
            <span className="ml-3 text-lg font-semibold text-[var(--color-krypton-muted)]">
              × {activeClue.count === 0 ? '∞' : activeClue.count}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-[var(--color-krypton-muted)]">Tentativas</p>
            <p className={`text-3xl font-black ${TEAM_COLOR[currentTeam]}`}>{guessDisplay}</p>
          </div>

          {isOperative && isMyTurn && turnPhase === 'guessing' && (
            <button
              id="end-turn-btn"
              onClick={onEndTurn}
              className="
                px-4 py-2 rounded-xl text-sm font-semibold
                border border-[var(--color-krypton-border)]
                text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]
                hover:bg-[var(--color-krypton-surface)] transition-all
              "
            >
              Encerrar turno
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Waiting for spymaster ────────────────────────────────

  return (
    <div className="
      flex items-center justify-center p-4 rounded-2xl
      bg-[var(--color-krypton-surface)] border border-[var(--color-krypton-border)]
    ">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${currentTeam === 'red' ? 'bg-[var(--color-team-red)]' : 'bg-[var(--color-team-blue)]'}`} />
        <p className="text-sm text-[var(--color-krypton-muted)]">
          Aguardando pista do Mestre {currentTeam === 'red' ? 'Vermelho' : 'Azul'}…
        </p>
      </div>
    </div>
  );
}
