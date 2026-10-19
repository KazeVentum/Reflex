"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, PartyPopper, PenLine, Plus } from "lucide-react";
import type { Book } from "@/types";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";

interface PageUpdateSheetProps {
  book: Book | null;
  onClose: () => void;
  onUpdate: (bookId: string, newPage: number, previousPage: number) => Promise<boolean>;
  // Se ofrece al terminar el libro: abre una reflexión escrita sobre él.
  onWriteReview?: (book: Book) => void;
}

export function PageUpdateSheet({ book, onClose, onUpdate, onWriteReview }: PageUpdateSheetProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (book) {
      setValue(book.current_page.toString());
      setFinished(false);
    }
  }, [book]);

  // Detecta teclado virtual con visualViewport (API correcta para mobile)
  useEffect(() => {
    if (!book) return;
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
  }, [book]);

  const maxPage = book?.total_pages ?? 9999;
  const parsed = parseInt(value, 10) || 0;
  const pct = book?.total_pages ? Math.min(100, Math.round((parsed / book.total_pages) * 100)) : null;

  const adjust = (delta: number) =>
    setValue(String(Math.min(maxPage, Math.max(0, parsed + delta))));

  const handleSave = async () => {
    if (!book) return;
    setSaving(true);
    const ok = await onUpdate(book.id, parsed, book.current_page);
    setSaving(false);
    const justFinished = ok && book.total_pages !== null && parsed >= book.total_pages && book.current_page < book.total_pages;
    if (justFinished) setFinished(true);
    else onClose();
  };

  return (
    <AnimatePresence>
      {book && (
        <>
          {/* Overlay encima de todo (BottomNav es z-50) */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[60] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet — bottom sheet en mobile, modal centrado en desktop */}
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
                maxHeight: isDesktop ? "85dvh" : "88dvh",
              }}
              initial={isDesktop ? { opacity: 0, scale: 0.95, y: 8 } : { y: "100%" }}
              animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
              exit={isDesktop ? { opacity: 0, scale: 0.95, y: 8 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: isDesktop ? 400 : 320, damping: 32 }}
            >
            {/* Contenido scrolleable */}
            <div className={`overflow-y-auto px-6 pt-4 pb-10 ${isDesktop ? "max-h-[85dvh]" : "max-h-[88dvh]"}`}>
              {/* Handle — solo en mobile */}
              {!isDesktop && <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-6" />}

              {finished ? (
                <motion.div
                  className="flex flex-col items-center text-center py-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <motion.div
                    className="h-16 w-16 rounded-full bg-[var(--accent)]/15 flex items-center justify-center mb-5"
                    initial={{ rotate: -20 }}
                    animate={{ rotate: [-20, 12, -6, 0] }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                  >
                    <PartyPopper size={30} strokeWidth={1.6} className="text-[var(--accent)]" />
                  </motion.div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] mb-1">Libro terminado</p>
                  <p className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--fg)] mb-1">
                    ¡Terminaste {book.title}!
                  </p>
                  <p className="text-sm text-[var(--muted)] mb-8">
                    {book.total_pages} páginas. ¿Qué te dejó esta lectura?
                  </p>
                  {onWriteReview && (
                    <button
                      onClick={() => onWriteReview(book)}
                      className="w-full flex items-center justify-center gap-2 py-4 mb-3 bg-[var(--accent)] text-[var(--bg)] rounded-2xl text-base font-medium hover:opacity-85 transition-opacity"
                    >
                      <PenLine size={18} />
                      Escribir una reseña
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-4 border border-[var(--border)] text-[var(--muted)] rounded-2xl text-base hover:text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
                  >
                    Ahora no
                  </button>
                </motion.div>
              ) : (
              <>
              {/* Header */}
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">
                Actualizando
              </p>
              <p className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--fg)] truncate mb-0.5">
                {book.title}
              </p>
              {book.total_pages && (
                <p className="text-sm text-[var(--muted)] mb-8">
                  {book.total_pages} páginas en total
                </p>
              )}

              {/* Stepper — 3 columnas fijas para que el + no se corte */}
              <div className="grid grid-cols-[64px_1fr_64px] gap-3 mb-6">
                <button
                  onClick={() => adjust(-1)}
                  className="h-16 rounded-2xl border-2 border-[var(--border)] flex items-center justify-center text-[var(--fg)] hover:border-[var(--accent)] active:bg-[var(--surface)] transition-colors"
                >
                  <Minus size={24} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={value}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setValue(raw === "" ? "" : String(Math.min(maxPage, parseInt(raw, 10))));
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-16 text-center text-4xl font-[family-name:var(--font-fraunces)] border-2 border-[var(--border)] rounded-2xl bg-transparent text-[var(--fg)] focus:outline-none focus:border-[var(--accent)] w-full"
                />

                <button
                  onClick={() => adjust(1)}
                  className="h-16 rounded-2xl border-2 border-[var(--border)] flex items-center justify-center text-[var(--fg)] hover:border-[var(--accent)] active:bg-[var(--surface)] transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Progress preview */}
              {book.total_pages && pct !== null && (
                <div className="mb-8">
                  <div className="h-2 w-full rounded-full bg-[var(--surface)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent)]"
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 28 }}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)] text-center mt-2">
                    {pct}% completado
                  </p>
                </div>
              )}

              {/* Save */}
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-[var(--fg)] text-[var(--bg)] rounded-2xl text-base font-medium hover:opacity-85 disabled:opacity-50 transition-opacity"
                whileTap={{ scale: 0.97 }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </motion.button>
              </>
              )}
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
