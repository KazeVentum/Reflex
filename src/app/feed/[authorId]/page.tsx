"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useAuthorFeed } from "@/lib/hooks/useAuthorFeed";
import { FeedItemCard } from "@/components/FeedItemCard";
import type { FeedReflection, FeedQuote, Book } from "@/types";

type BookRef = Pick<Book, "id" | "title" | "author">;

interface BookGroup {
  book: BookRef | null;
  reflections: FeedReflection[];
  quotes: FeedQuote[];
}

export default function AuthorFeedPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const { profile, reflections, quotes, loading } = useAuthorFeed(authorId);

  const groups = useMemo(() => {
    const byBook = new Map<string, BookGroup>();
    const keyOf = (b?: BookRef) => b?.id ?? "sin-libro";

    for (const r of reflections) {
      const k = keyOf(r.books);
      if (!byBook.has(k)) byBook.set(k, { book: r.books ?? null, reflections: [], quotes: [] });
      byBook.get(k)!.reflections.push(r);
    }
    for (const q of quotes) {
      const k = keyOf(q.books);
      if (!byBook.has(k)) byBook.set(k, { book: q.books ?? null, reflections: [], quotes: [] });
      byBook.get(k)!.quotes.push(q);
    }
    return Array.from(byBook.values());
  }, [reflections, quotes]);

  return (
    <>
      <Sidebar />
      <main className="min-h-screen flex flex-col px-5 pt-10 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
        {loading && <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>}

        {!loading && !profile && (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            Este autor no está disponible.
          </p>
        )}

        {!loading && profile && (
          <>
            <motion.h1
              className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)] mb-6 md:mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {profile.display_name}
            </motion.h1>

            {groups.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-12">
                Sin contenido público todavía.
              </p>
            )}

            <div className="flex flex-col gap-8">
              {groups.map((g) => (
                <section key={g.book?.id ?? "sin-libro"}>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-3">
                    {g.book ? `${g.book.title}${g.book.author ? ` — ${g.book.author}` : ""}` : "Sin libro asociado"}
                  </p>
                  <div className="flex flex-col gap-3.5 md:columns-2 md:gap-4 xl:columns-3">
                    {g.reflections.map((r) => (
                      <div key={r.id} className="md:mb-4 md:break-inside-avoid">
                        <FeedItemCard type="reflection" item={r} />
                      </div>
                    ))}
                    {g.quotes.map((q) => (
                      <div key={q.id} className="md:mb-4 md:break-inside-avoid">
                        <FeedItemCard type="quote" item={q} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
