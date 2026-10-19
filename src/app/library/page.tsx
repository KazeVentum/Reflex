"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, PenLine } from "lucide-react";
import { useReflections } from "@/lib/hooks/useReflections";
import { useBooks } from "@/lib/hooks/useBooks";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { ReflectionCard } from "@/components/ReflectionCard";
import { QuoteCard } from "@/components/QuoteCard";
import { QuoteForm } from "@/components/QuoteForm";
import { ReflectionForm } from "@/components/ReflectionForm";
import { QuoteEditSheet } from "@/components/QuoteEditSheet";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import type { Quote } from "@/types";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<"reflections" | "quotes">("reflections");
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [writing, setWriting] = useState(false);

  const { reflections, loading: loadingReflections, deleteReflection, updateReflection, refetch: refetchReflections } = useReflections({
    bookId: selectedBookId,
    tag: selectedTag,
  });

  const { quotes, loading: loadingQuotes, deleteQuote, updateQuote, addQuote } = useQuotes({
    bookId: selectedBookId,
    tag: selectedTag,
  });

  const { books } = useBooks();

  const loading = activeTab === "reflections" ? loadingReflections : loadingQuotes;
  const itemsCount = activeTab === "reflections" ? reflections.length : quotes.length;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    if (activeTab === "reflections") {
      reflections.forEach((r) => r.tags.forEach((t) => set.add(t)));
    } else {
      quotes.forEach((q) => q.tags.forEach((t) => set.add(t)));
    }
    return Array.from(set).sort();
  }, [reflections, quotes, activeTab]);

  return (
    <>
    <Sidebar />
    <main className="min-h-screen flex flex-col px-5 pt-20 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
      <motion.h1
        className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)] mb-6 md:mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Biblioteca
      </motion.h1>

      <div className="flex flex-col gap-3 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Selector de Pestañas */}
        <motion.div
          className="flex bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] md:w-64 md:shrink-0"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => {
              setActiveTab("reflections");
              setSelectedTag(undefined);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "reflections"
                ? "bg-[var(--bg)] text-[var(--fg)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Reflexiones
          </button>
          <button
            onClick={() => {
              setActiveTab("quotes");
              setSelectedTag(undefined);
              setWriting(false);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "quotes"
                ? "bg-[var(--bg)] text-[var(--fg)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Citas
          </button>
        </motion.div>

        <motion.select
          value={selectedBookId ?? ""}
          onChange={(e) => setSelectedBookId(e.target.value || undefined)}
          className="w-full px-3.5 py-3.5 border border-[var(--border)] rounded-2xl bg-[var(--bg)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)] md:max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <option value="">Todos los libros</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </motion.select>
      </div>

      {allTags.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-1.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
              whileTap={{ scale: 0.94 }}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded-full border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
              }`}
            >
              #{tag}
            </motion.button>
          ))}
        </motion.div>
      )}
      </div>

      {/* Todo el contenido del tab en un solo bloque keyed — sin elementos sueltos fuera */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-3.5"
        >
          {activeTab === "quotes" && <QuoteForm onSave={addQuote} />}

          {activeTab === "reflections" && writing && (
            <ReflectionForm
              onSaved={() => { setWriting(false); refetchReflections(); }}
              onCancel={() => setWriting(false)}
            />
          )}

          {activeTab === "reflections" && !writing && (
            <div className="flex gap-3 mb-3">
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
              >
                <Mic size={17} strokeWidth={1.8} className="text-[var(--accent)]" />
                Grabar
              </Link>
              <button
                onClick={() => setWriting(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
              >
                <PenLine size={17} strokeWidth={1.8} className="text-[var(--accent)]" />
                Escribir
              </button>
            </div>
          )}

          {loading && (
            <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>
          )}

          {!loading && itemsCount === 0 && !writing && (
            <p className="text-sm text-[var(--muted)] text-center py-12 leading-relaxed">
              {activeTab === "reflections"
                ? "Aún no hay reflexiones. Graba o escribe tu primer pensamiento."
                : "Aún no tienes citas guardadas. Agrega la primera con el botón de arriba."}
            </p>
          )}

          {!writing && (
          <div className={`flex flex-col gap-3.5 md:block md:columns-2 md:gap-4 ${activeTab === "reflections" ? "2xl:columns-3" : "xl:columns-3 2xl:columns-4"}`}>
            {!loading && activeTab === "reflections" && reflections.map((r) => (
              <div key={r.id} className="md:mb-4 md:break-inside-avoid">
                <ReflectionCard reflection={r} onDelete={deleteReflection} onUpdate={updateReflection} />
              </div>
            ))}

            {!loading && activeTab === "quotes" && quotes.map((q) => (
              <div key={q.id} className="md:mb-4 md:break-inside-avoid">
                <QuoteCard quote={q} onDelete={deleteQuote} onEdit={setEditingQuote} />
              </div>
            ))}
          </div>
          )}
        </motion.div>
      </AnimatePresence>

      <QuoteEditSheet
        quote={editingQuote}
        onClose={() => setEditingQuote(null)}
        onSave={updateQuote}
      />

      <BottomNav />
    </main>
    </>
  );
}
