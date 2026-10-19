"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { toLocalDateStr } from "@/lib/date";
import type { DailyActivity, ReadingEntry } from "@/types";

const supabase = createClient();

export const READING_LOGS_KEY = "reading_logs";

async function fetchReadingEntries(): Promise<ReadingEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - 364);

  const { data, error } = await supabase
    .from("reading_logs")
    .select("*, books(id, title, total_pages)")
    .eq("user_id", user.id)
    .gte("logged_at", toLocalDateStr(since))
    .order("logged_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ReadingEntry[];
}

export function useReadingLogs() {
  const { data: entries = [], isLoading } = useSWR<ReadingEntry[]>(
    READING_LOGS_KEY,
    fetchReadingEntries,
    { revalidateOnFocus: false }
  );

  // Total de páginas por día (todos los libros), para el mapa de actividad.
  const logs = useMemo<DailyActivity[]>(() => {
    const byDate = new Map<string, number>();
    for (const e of entries) byDate.set(e.logged_at, (byDate.get(e.logged_at) ?? 0) + e.pages_read);
    return Array.from(byDate, ([date, count]) => ({ date, count }));
  }, [entries]);

  return { logs, entries, isLoading };
}
