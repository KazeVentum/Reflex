"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

async function fetchTags(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const set = new Set<string>();

  // Explicit user_id filter, not just RLS: RLS also grants read access to
  // OTHER users' public reflections/quotes (for the feed), which would
  // otherwise leak into "my" tag suggestions.
  const { data: reflectionsData } = await supabase.from("reflections").select("tags").eq("user_id", user.id);
  reflectionsData?.forEach((r) => r.tags?.forEach((t: string) => set.add(t.toLowerCase())));

  // Obtener etiquetas de citas (con control de errores por si no se ha ejecutado la migración)
  try {
    const { data: quotesData, error } = await supabase.from("quotes").select("tags").eq("user_id", user.id);
    if (!error && quotesData) {
      quotesData.forEach((q) => q.tags?.forEach((t: string) => set.add(t.toLowerCase())));
    }
  } catch (e) {
    console.warn("Quotes table may not exist yet:", e);
  }

  return Array.from(set).sort();
}

export function useTags() {
  const { data: tags = [], mutate } = useSWR<string[]>(
    "tags",
    fetchTags,
    { revalidateOnFocus: false }
  );

  return { tags, refetch: () => mutate() };
}
