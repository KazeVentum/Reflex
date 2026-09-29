"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const supabase = createClient();

async function fetchFeaturedProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_featured", true)
    .order("display_name", { ascending: true });
  return (data as Profile[]) ?? [];
}

export function useFeaturedProfiles() {
  const { data: profiles = [], isLoading: loading } = useSWR<Profile[]>(
    "featured-profiles",
    fetchFeaturedProfiles,
    { revalidateOnFocus: false }
  );
  return { profiles, loading };
}
