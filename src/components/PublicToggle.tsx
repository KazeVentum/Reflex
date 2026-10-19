"use client";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function PublicToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm text-[var(--fg)]">Hacer pública</span>
        <span className="text-xs text-[var(--muted)]">Visible en tu perfil público</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Hacer pública"
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          value
            ? "bg-[var(--accent)] border-[var(--accent)] hover:opacity-85"
            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        <span
          className="absolute top-1 left-1 h-4 w-4 rounded-full transition-transform"
          style={{
            transform: value ? "translateX(20px)" : "none",
            backgroundColor: value ? "var(--bg)" : "var(--muted)",
          }}
        />
      </button>
    </div>
  );
}
