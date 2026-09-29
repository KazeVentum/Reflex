"use client";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Quote } from "@/types";

interface Filters {
  bookId?: string;
  tag?: string;
}

const supabase = createClient();

function makeKey(filters: Filters) {
  return ["quotes", filters.bookId ?? "", filters.tag ?? ""];
}

async function fetchQuotes([, bookId, tag]: [string, string, string]): Promise<Quote[]> {
  let query = supabase
    .from("quotes")
    .select("*, books(id, title, author)")
    .order("created_at", { ascending: false });

  if (bookId) query = query.eq("book_id", bookId);
  if (tag) query = query.contains("tags", [tag]);

  const { data } = await query;
  return (data as Quote[]) ?? [];
}

export function useQuotes(filters: Filters = {}) {
  const { data: quotes = [], isLoading: loading, mutate } = useSWR<Quote[]>(
    makeKey(filters),
    fetchQuotes,
    { revalidateOnFocus: false }
  );

  const deleteQuote = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (!error) {
      mutate(quotes.filter((q) => q.id !== id), false);
      return true;
    }
    return false;
  };

  const updateQuote = async (
    id: string,
    updates: Partial<Pick<Quote, "book_id" | "page_number" | "quote_text" | "notes" | "tags" | "is_public">>
  ): Promise<boolean> => {
    const { error } = await supabase.from("quotes").update(updates).eq("id", id);
    if (!error) {
      let updatedBook: any = undefined;
      if (updates.book_id) {
        const { data: bookData } = await supabase
          .from("books")
          .select("*")
          .eq("id", updates.book_id)
          .single();
        if (bookData) {
          updatedBook = bookData;
        }
      }
      
      mutate(
        quotes.map((q) => {
          if (q.id === id) {
            const nextBook = updates.book_id === null 
              ? undefined 
              : (updates.book_id !== undefined ? updatedBook : q.books);
            return {
              ...q,
              ...updates,
              books: nextBook,
            } as Quote;
          }
          return q;
        }),
        false
      );
      return true;
    }
    return false;
  };

  const addQuote = async (
    bookId: string | null,
    pageNumber: number | null,
    quoteText: string,
    notes: string | null,
    tags: string[]
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const newQuote = {
      user_id: user.id,
      book_id: bookId,
      page_number: pageNumber,
      quote_text: quoteText,
      notes: notes,
      tags: tags,
    };

    const { data, error } = await supabase
      .from("quotes")
      .insert(newQuote)
      .select("*, books(id, title, author)")
      .single();

    if (!error && data) {
      mutate([data as Quote, ...quotes], false);
      return true;
    }
    return false;
  };

  return { quotes, loading, refetch: () => mutate(), deleteQuote, updateQuote, addQuote };
}
