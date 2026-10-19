"use client";
import { useMemo, useState } from "react";
import { ArrowRight, PartyPopper } from "lucide-react";
import type { ReadingEntry } from "@/types";
import { toLocalDateStr } from "@/lib/date";

interface Props {
  entries: ReadingEntry[];
  selectedDate?: string | null;
  onClearDate?: () => void;
}

const PAGE_SIZE = 7;

function dayLabel(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === toLocalDateStr(today)) return "Hoy";
  if (dateStr === toLocalDateStr(yesterday)) return "Ayer";
  const d = new Date(dateStr + "T00:00:00");
  const sameYear = d.getFullYear() === today.getFullYear();
  const label = d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ReadingHistory({ entries, selectedDate, onClearDate }: Props) {
  const [visibleDays, setVisibleDays] = useState(PAGE_SIZE);

  // Agrupado por día (entries ya viene ordenado del más reciente al más viejo).
  const days = useMemo(() => {
    const groups: { date: string; items: ReadingEntry[]; total: number }[] = [];
    for (const e of entries) {
      if (e.pages_read <= 0) continue;
      if (selectedDate && e.logged_at !== selectedDate) continue;
      const last = groups[groups.length - 1];
      if (last && last.date === e.logged_at) {
        last.items.push(e);
        last.total += e.pages_read;
      } else {
        groups.push({ date: e.logged_at, items: [e], total: e.pages_read });
      }
    }
    return groups;
  }, [entries, selectedDate]);

  const shown = selectedDate ? days : days.slice(0, visibleDays);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Historial</p>
        {selectedDate && onClearDate && (
          <button
            onClick={onClearDate}
            className="text-xs text-[var(--accent)] hover:opacity-75 transition-opacity"
          >
            Ver todo
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <p className="text-sm text-[var(--muted)] py-6">
          {selectedDate
            ? `${dayLabel(selectedDate)} no registraste lectura.`
            : "Cuando actualices la página de un libro, tu avance aparecerá aquí."}
        </p>
      )}

      <ol className="flex flex-col">
        {shown.map(({ date, items, total }) => (
          <li key={date} className="relative pl-5 pb-5 border-l border-[var(--border)] last:pb-0">
            <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-[var(--fg)]">{dayLabel(date)}</p>
              <p className="text-xs text-[var(--muted)] shrink-0">{total} {total === 1 ? "página" : "páginas"}</p>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((e) => {
                const finished = e.end_page !== null && e.books?.total_pages != null && e.end_page >= e.books.total_pages;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]"
                  >
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-fraunces)] text-[var(--fg)] truncate">
                        {e.books?.title ?? "Libro eliminado"}
                      </p>
                      {finished && (
                        <p className="flex items-center gap-1 text-xs text-[var(--accent)] mt-0.5">
                          <PartyPopper size={12} strokeWidth={1.8} />
                          Lo terminaste
                        </p>
                      )}
                    </div>
                    {e.start_page !== null && e.end_page !== null ? (
                      <p className="flex items-center gap-1.5 text-sm tabular-nums text-[var(--fg)] shrink-0">
                        <span className="text-[var(--muted)]">pág.</span>
                        {e.start_page}
                        <ArrowRight size={13} className="text-[var(--accent)]" />
                        {e.end_page}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted)] shrink-0">+{e.pages_read} págs.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {!selectedDate && days.length > visibleDays && (
        <button
          onClick={() => setVisibleDays((n) => n + PAGE_SIZE)}
          className="self-start mt-4 px-4 py-2 text-xs font-medium text-[var(--muted)] border border-[var(--border)] rounded-xl hover:text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
        >
          Ver días anteriores
        </button>
      )}
    </div>
  );
}
