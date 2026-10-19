"use client";
import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { toLocalDateStr } from "@/lib/date";
import { READING_LOGS_KEY } from "@/lib/hooks/useReadingLogs";
import type { Book } from "@/types";

const supabase = createClient();

async function fetchBooks(): Promise<Book[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Explicit user_id filter, not just RLS: RLS also grants read access to
  // OTHER users' books that have a public reflection/quote (for the feed),
  // so relying on RLS alone here would leak other people's public books
  // into "my" book list.
  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("title", { ascending: true });
  return data ?? [];
}

export function useBooks() {
  const { data: books = [], isLoading: loading, mutate } = useSWR<Book[]>(
    "books",
    fetchBooks,
    { revalidateOnFocus: false }
  );

  const addBook = async (title: string, author?: string, totalPages?: number): Promise<Book | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("books")
      .insert({ title, author: author || null, user_id: user.id, total_pages: totalPages ?? null })
      .select()
      .single();
    if (!error && data) {
      mutate([...books, data].sort((a, b) => a.title.localeCompare(b.title)), false);
      return data;
    }
    return null;
  };

  const updateBook = async (
    id: string,
    title: string,
    author?: string,
    totalPages?: number
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("books")
      .update({ title, author: author || null, total_pages: totalPages ?? null })
      .eq("id", id);
    if (!error) {
      mutate(
        books.map((b) => b.id === id ? { ...b, title, author: author || null, total_pages: totalPages ?? null } : b)
          .sort((a, b) => a.title.localeCompare(b.title)),
        false
      );
      return true;
    }
    return false;
  };

  const updateCurrentPage = async (id: string, newPage: number, previousPage: number): Promise<boolean> => {
    const { error } = await supabase
      .from("books")
      .update({ current_page: newPage })
      .eq("id", id);
    if (error) return false;

    mutate(
      books.map((b) => b.id === id ? { ...b, current_page: newPage } : b),
      false
    );

    // Si baja (corrección), log_reading ajusta el registro de hoy.
    if (newPage !== previousPage) {
      await supabase.rpc("log_reading", {
        p_book_id: id,
        p_start_page: previousPage,
        p_end_page: newPage,
        p_logged_at: toLocalDateStr(new Date()),
      });
      globalMutate(READING_LOGS_KEY);
    }

    return true;
  };

  const deleteBook = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (!error) {
      mutate(books.filter((b) => b.id !== id), false);
      return true;
    }
    return false;
  };

  return { books, loading, addBook, updateBook, deleteBook, updateCurrentPage, refetch: () => mutate() };
}
