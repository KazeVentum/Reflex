"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const supabase = createClient();

async function fetchProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
  return (data as Profile[]) ?? [];
}

export function useProfiles() {
  const { data: profiles = [], isLoading: loading, mutate } = useSWR<Profile[]>(
    "profiles",
    fetchProfiles,
    { revalidateOnFocus: false }
  );

  const toggleFeatured = async (id: string, isFeatured: boolean): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .update({ is_featured: isFeatured })
      .eq("id", id)
      .select()
      .maybeSingle();

    // If RLS silently blocks a non-admin's update, Supabase returns
    // { data: null, error: null } — checking `data` is what actually
    // detects that case, not just `error`.
    if (!data) return false;

    mutate(profiles.map((p) => (p.id === id ? { ...p, is_featured: isFeatured } : p)), false);
    return true;
  };

  return { profiles, loading, toggleFeatured, refetch: () => mutate() };
}
