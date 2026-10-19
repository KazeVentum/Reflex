"use client";

interface BookProgressBarProps {
  current: number;
  total: number | null;
  className?: string;
}

export function BookProgressBar({ current, total, className = "" }: BookProgressBarProps) {
  if (total === null || total === 0) {
    if (current === 0) return null;
    return (
      <span className={`text-xs text-[var(--muted)] ${className}`}>
        pág. {current}
      </span>
    );
  }

  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="h-1.5 w-full rounded-full bg-[var(--surface)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--muted)]">
        {current >= total ? `Terminado · ${total} páginas` : `pág. ${current} de ${total} · ${pct}%`}
      </span>
    </div>
  );
}
