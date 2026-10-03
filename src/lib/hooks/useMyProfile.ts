"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const supabase = createClient();

async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
}

export function useMyProfile() {
  const { data: profile, isLoading: loading, mutate } = useSWR<Profile | null>(
    "my-profile",
    fetchMyProfile,
    { revalidateOnFocus: false }
  );

  const updateDisplayName = async (name: string): Promise<boolean> => {
    const { error } = await supabase.rpc("update_my_display_name", { new_name: name });
    if (error) return false;
    await mutate();
    return true;
  };

  return { profile: profile ?? null, loading, updateDisplayName, refetch: () => mutate() };
}
