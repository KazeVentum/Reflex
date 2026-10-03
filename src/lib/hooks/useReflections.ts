"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Reflection } from "@/types";

interface Filters {
  bookId?: string;
  tag?: string;
}

const supabase = createClient();

function makeKey(filters: Filters) {
  return ["reflections", filters.bookId ?? "", filters.tag ?? ""];
}

async function fetchReflections([, bookId, tag]: [string, string, string]): Promise<Reflection[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Explicit user_id filter, not just RLS: RLS also grants read access to
  // OTHER users' public reflections (for the feed), so relying on RLS
  // alone here would leak other people's public reflections into "my"
  // library.
  let query = supabase
    .from("reflections")
    .select("*, books(id, title, author)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (bookId) query = query.eq("book_id", bookId);
  if (tag) query = query.contains("tags", [tag]);

  const { data } = await query;
  return (data as Reflection[]) ?? [];
}

export function useReflections(filters: Filters = {}) {
  const { data: reflections = [], isLoading: loading, mutate } = useSWR<Reflection[]>(
    makeKey(filters),
    fetchReflections,
    { revalidateOnFocus: false }
  );

  const deleteReflection = async (id: string, audioPath: string) => {
    await supabase.storage.from("reflections").remove([audioPath]);
    await supabase.from("reflections").delete().eq("id", id);
    mutate(reflections.filter((r) => r.id !== id), false);
  };

  const updateReflection = async (
    id: string,
    updates: Partial<Pick<Reflection, "title" | "book_id" | "page_number" | "tags" | "notes" | "is_public">>
  ): Promise<boolean> => {
    const { error } = await supabase.from("reflections").update(updates).eq("id", id);
    if (!error) {
      mutate(reflections.map((r) => r.id === id ? { ...r, ...updates } : r), false);
      return true;
    }
    return false;
  };

  return { reflections, loading, refetch: () => mutate(), deleteReflection, updateReflection };
}
