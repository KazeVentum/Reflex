"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { FeedReflection, FeedQuote, Profile } from "@/types";

const supabase = createClient();

async function fetchAuthorFeed(authorId: string) {
  const [{ data: profile }, { data: reflections }, { data: quotes }] = await Promise.all([
    // No .eq("is_featured", true) here on purpose: a profile is visible if
    // it has public content (public_authors_select_authenticated RLS
    // policy), regardless of featured status — featured only curates the
    // /feed index, not an individual's own profile/wall.
    supabase.from("profiles").select("*").eq("id", authorId).maybeSingle(),
    supabase
      .from("reflections")
      .select("*, books(id, title, author), profiles!inner(id, display_name)")
      .eq("user_id", authorId)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("*, books(id, title, author), profiles!inner(id, display_name)")
      .eq("user_id", authorId)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ]);

  return {
    profile: (profile as Profile) ?? null,
    reflections: (reflections as FeedReflection[]) ?? [],
    quotes: (quotes as FeedQuote[]) ?? [],
  };
}

export function useAuthorFeed(authorId: string) {
  const { data, isLoading: loading } = useSWR(
    ["author-feed", authorId],
    () => fetchAuthorFeed(authorId),
    { revalidateOnFocus: false }
  );

  return {
    profile: data?.profile ?? null,
    reflections: data?.reflections ?? [],
    quotes: data?.quotes ?? [],
    loading,
  };
}
