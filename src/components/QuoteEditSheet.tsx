"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Quote } from "@/types";
import { BookPicker } from "@/components/BookPicker";
import { TagInput } from "@/components/TagInput";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";

interface QuoteEditSheetProps {
  quote: Quote | null;
  onClose: () => void;
  onSave: (
    id: string,
    updates: Partial<Pick<Quote, "book_id" | "page_number" | "quote_text" | "notes" | "tags" | "is_public">>
  ) => Promise<boolean>;
}

const inputClass =
  "w-full px-4 py-3 border border-[var(--border)] rounded-2xl bg-transparent text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]";

export function QuoteEditSheet({ quote, onClose, onSave }: QuoteEditSheetProps) {
  const [bookId, setBookId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (quote) {
      setBookId(quote.book_id);
      setPageNumber(quote.page_number?.toString() ?? "");
      setQuoteText(quote.quote_text);
      setTags(quote.tags);
      setNotes(quote.notes ?? "");
      setIsPublic(quote.is_public);
    }
  }, [quote]);

  useEffect(() => {
    if (!quote) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKbOffset(Math.max(0, offset));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKbOffset(0);
    };
  }, [quote]);

  const handleSave = async () => {
    if (!quote || !quoteText.trim()) return;
    setSaving(true);
    const ok = await onSave(quote.id, {
      book_id: bookId,
      page_number: pageNumber ? parseInt(pageNumber, 10) : null,
      quote_text: quoteText.trim(),
      tags,
      notes: notes.trim() || null,
      is_public: isPublic,
    });
    if (ok) onClose();
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {quote && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[60] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div
            className={
              isDesktop
                ? "fixed inset-0 z-[70] flex items-center justify-center px-6 pointer-events-none"
                : "contents"
            }
          >
            <motion.div
              key="sheet"
              className={
                isDesktop
                  ? "pointer-events-auto w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-3xl shadow-2xl"
                  : "fixed left-0 right-0 z-[70] bg-[var(--bg)] rounded-t-3xl shadow-2xl"
              }
              style={{
                bottom: isDesktop ? undefined : kbOffset,
                maxHeight: isDesktop ? "88dvh" : "92dvh",
              }}
              initial={isDesktop ? { opacity: 0, scale: 0.95, y: 8 } : { y: "100%" }}
              animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
              exit={isDesktop ? { opacity: 0, scale: 0.95, y: 8 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: isDesktop ? 400 : 320, damping: 32 }}
            >
            <div className={`overflow-y-auto px-5 pt-4 pb-10 ${isDesktop ? "max-h-[88dvh]" : "max-h-[92dvh]"}`}>
              {/* Handle — solo en mobile */}
              {!isDesktop && <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-5" />}

              {/* Header */}
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Editando cita</p>
              <p className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--fg)] truncate mb-6">
                {quote.books?.title ?? "Sin libro"}
              </p>

              <div className="flex flex-col gap-5">
                {/* Cita textual */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Cita textual *
                  </label>
                  <textarea
                    required
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    rows={4}
                    placeholder="Escribe la cita..."
                    className={`${inputClass} font-[family-name:var(--font-fraunces)] italic leading-relaxed resize-none`}
                  />
                </div>

                {/* Libro */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Libro
                  </label>
                  <BookPicker value={bookId} onChange={setBookId} />
                </div>

                {/* Página */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Página
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Tags
                  </label>
                  <TagInput value={tags} onChange={setTags} />
                </div>

                {/* Notas */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Tu interpretación / notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="¿Qué te generó esta cita?"
                    className={`${inputClass} resize-none leading-relaxed`}
                  />
                </div>

                {/* Hacer pública */}
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-sm text-[var(--fg)]">Hacer pública</span>
                    <span className="text-xs text-[var(--muted)]">
                      Visible en el feed si estás destacado
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Hacer pública"
                    onClick={() => setIsPublic((v) => !v)}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                      isPublic
                        ? "bg-[var(--accent)] border-[var(--accent)]"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className="absolute top-1 left-1 h-4 w-4 rounded-full transition-transform"
                      style={{
                        transform: isPublic ? "translateX(20px)" : "none",
                        backgroundColor: isPublic ? "var(--bg)" : "var(--muted)",
                      }}
                    />
                  </button>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 border border-[var(--border)] text-[var(--muted)] rounded-2xl text-sm transition-colors hover:border-[var(--accent)]"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving || !quoteText.trim()}
                    className="flex-1 py-4 bg-[var(--fg)] text-[var(--bg)] rounded-2xl text-sm font-medium hover:opacity-85 disabled:opacity-50 transition-opacity"
                    whileTap={{ scale: 0.97 }}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </motion.button>
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
