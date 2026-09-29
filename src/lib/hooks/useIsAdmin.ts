"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

async function fetchIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return data?.is_admin ?? false;
}

export function useIsAdmin() {
  const { data: isAdmin = false, isLoading: loading } = useSWR("is-admin", fetchIsAdmin, {
    revalidateOnFocus: false,
  });
  return { isAdmin, loading };
}
