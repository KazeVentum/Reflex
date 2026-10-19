"use client";
import { useMemo } from "react";
import { Flame } from "lucide-react";
import type { DailyActivity } from "@/types";
import { toLocalDateStr } from "@/lib/date";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";

interface ReadingHeatmapProps {
  logs: DailyActivity[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}

// En mobile caben ~4 meses con celdas tocables sin scroll horizontal.
const WEEKS_DESKTOP = 26;
const WEEKS_MOBILE = 15;
const DAY_LABELS = ["L", "", "X", "", "V", "", "D"];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function intensityClass(pages: number, max: number): string {
  if (pages === 0 || max === 0) return "opacity-10";
  const ratio = pages / max;
  if (ratio < 0.25) return "opacity-30";
  if (ratio < 0.5) return "opacity-55";
  if (ratio < 0.75) return "opacity-75";
  return "opacity-100";
}

function calcStreak(logs: DailyActivity[]): number {
  const today = toLocalDateStr(new Date());
  const activitySet = new Set(logs.filter((l) => l.count > 0).map((l) => l.date));

  let streak = 0;
  const cursor = new Date();

  // Si hoy no tiene actividad, empezamos desde ayer
  if (!activitySet.has(today)) cursor.setDate(cursor.getDate() - 1);

  while (activitySet.has(toLocalDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--fg)] leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] mt-1.5">{label}</span>
    </div>
  );
}

export function ReadingHeatmap({ logs, selectedDate, onSelectDate }: ReadingHeatmapProps) {
  const weekCount = useIsDesktop() ? WEEKS_DESKTOP : WEEKS_MOBILE;

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) map.set(l.date, l.count);
    return map;
  }, [logs]);

  const maxPages = useMemo(() => Math.max(0, ...logs.map((l) => l.count)), [logs]);
  const streak = useMemo(() => calcStreak(logs), [logs]);

  const { pagesThisMonth, daysThisMonth } = useMemo(() => {
    const prefix = toLocalDateStr(new Date()).slice(0, 7);
    let pages = 0;
    let days = 0;
    for (const l of logs) {
      if (l.date.startsWith(prefix) && l.count > 0) { pages += l.count; days++; }
    }
    return { pagesThisMonth: pages, daysThisMonth: days };
  }, [logs]);

  // Columnas = semanas (lunes a domingo), la última es la semana actual.
  const weeks = useMemo(() => {
    const todayStr = toLocalDateStr(new Date());
    const start = getMondayOf(new Date());
    start.setDate(start.getDate() - (weekCount - 1) * 7);

    return Array.from({ length: weekCount }, (_, w) => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + w * 7 + i);
        const dateStr = toLocalDateStr(d);
        return {
          dateStr,
          pages: activityMap.get(dateStr) ?? 0,
          isToday: dateStr === todayStr,
          isFuture: dateStr > todayStr,
        };
      });
      const first = new Date(days[0].dateStr + "T00:00:00");
      // Etiqueta de mes en la primera semana que contiene un día 1–7.
      const monthLabel = first.getDate() <= 7
        ? first.toLocaleDateString("es", { month: "short" }).replace(".", "")
        : "";
      return { days, monthLabel };
    });
  }, [activityMap, weekCount]);

  const formatDay = (str: string) =>
    new Date(str + "T00:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <span className="text-sm font-medium text-[var(--fg)]">Actividad lectora</span>
        <div className="flex gap-6 md:gap-8">
          <Stat
            value={
              <span className="flex items-center gap-1">
                {streak}
                {streak > 0 && <Flame size={16} className="text-[var(--accent)]" />}
              </span>
            }
            label={streak === 1 ? "día de racha" : "días de racha"}
          />
          <Stat value={pagesThisMonth} label="páginas este mes" />
          <Stat value={daysThisMonth} label={daysThisMonth === 1 ? "día este mes" : "días este mes"} />
        </div>
      </div>

      <div className="flex gap-1 md:gap-[3px]">
        <div className="flex flex-col gap-1 md:gap-[3px] pr-1">
          <span className="h-4 text-[10px]" />
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="flex-1 md:flex-none md:h-3.5 flex items-center text-[10px] text-[var(--muted)]">{label}</span>
          ))}
        </div>
        {weeks.map(({ days, monthLabel }) => (
          <div key={days[0].dateStr} className="flex flex-col gap-1 md:gap-[3px] flex-1 min-w-0">
            <span className="h-4 text-[10px] md:text-[11px] text-[var(--muted)] capitalize whitespace-nowrap overflow-visible">{monthLabel}</span>
              {days.map(({ dateStr, pages, isToday, isFuture }) => {
                const selected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isFuture || !onSelectDate}
                    onClick={() => onSelectDate?.(selected ? null : dateStr)}
                    title={`${formatDay(dateStr)} · ${pages > 0 ? `${pages} páginas` : "sin lectura"}`}
                    aria-label={`${formatDay(dateStr)}: ${pages} páginas`}
                    className={[
                      "relative aspect-square md:aspect-auto md:h-3.5 w-full rounded-[4px] md:rounded-[3px] transition-transform enabled:hover:scale-125 disabled:cursor-default",
                      isFuture ? "invisible" : "",
                      selected || isToday ? "ring-1 ring-[var(--fg)] ring-offset-1 ring-offset-[var(--surface)]" : "",
                    ].join(" ")}
                  >
                    <span className={`absolute inset-0 rounded-[inherit] bg-[var(--accent)] ${intensityClass(pages, maxPages)}`} />
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--muted)]">
        <span>Menos</span>
        {["opacity-10", "opacity-30", "opacity-55", "opacity-75", "opacity-100"].map((o) => (
          <span key={o} className={`h-2.5 w-2.5 rounded-[3px] bg-[var(--accent)] ${o}`} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
