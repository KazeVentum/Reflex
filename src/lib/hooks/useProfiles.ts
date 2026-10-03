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

  const toggleFlag = async (
    id: string,
    field: "is_featured" | "is_verified",
    value: boolean
  ): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .maybeSingle();

    // If RLS silently blocks a non-admin's update, Supabase returns
    // { data: null, error: null } — checking `data` is what actually
    // detects that case, not just `error`.
    if (!data) return false;

    mutate(profiles.map((p) => (p.id === id ? { ...p, [field]: value } : p)), false);
    return true;
  };

  const toggleFeatured = (id: string, isFeatured: boolean) => toggleFlag(id, "is_featured", isFeatured);
  const toggleVerified = (id: string, isVerified: boolean) => toggleFlag(id, "is_verified", isVerified);

  return { profiles, loading, toggleFeatured, toggleVerified, refetch: () => mutate() };
}
