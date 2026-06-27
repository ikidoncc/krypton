import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface RoomCodeProps {
  code: string;
  size?: 'sm' | 'lg';
}

export function RoomCode({ code, size = 'lg' }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const letters = code.split('');

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-[var(--color-krypton-muted)]">
        Código da Sala
      </p>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {letters.map((char, i) => (
            <span
              key={`${char}-${i}`}
              className={`
                inline-flex items-center justify-center rounded-md font-mono font-bold
                bg-[var(--color-krypton-surface)] border border-[var(--color-krypton-border)]
                text-[var(--color-krypton-text)]
                ${size === 'lg' ? 'w-10 h-12 text-xl' : 'w-7 h-8 text-sm'}
              `}
            >
              {char}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          title="Copiar código"
          className="
            ml-1 p-2 rounded-md transition-all duration-200
            text-[var(--color-krypton-muted)] hover:text-[var(--color-krypton-text)]
            hover:bg-[var(--color-krypton-surface)]
          "
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
