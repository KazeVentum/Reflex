"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const supabase = createClient();

async function searchProfiles(query: string): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("display_name", `%${query}%`)
    .order("display_name", { ascending: true })
    .limit(20);
  return (data as Profile[]) ?? [];
}

// RLS naturally scopes results to profiles the caller can actually see
// (own row, featured, has public content, or any row if the caller is
// admin) — searching for someone with no public content and no featured
// flag simply returns nothing, which matches "there's nothing to show
// there anyway".
export function useProfileSearch(query: string) {
  const trimmed = query.trim();
  const { data: results = [], isLoading: loading } = useSWR<Profile[]>(
    trimmed ? ["profile-search", trimmed] : null,
    () => searchProfiles(trimmed),
    { revalidateOnFocus: false }
  );
  return { results, loading };
}
