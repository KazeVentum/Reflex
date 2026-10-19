"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookPicker } from "@/components/BookPicker";
import { TagInput } from "@/components/TagInput";
import { PublicToggle } from "@/components/PublicToggle";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onSave: (
    bookId: string | null,
    pageNumber: number | null,
    quoteText: string,
    notes: string | null,
    tags: string[],
    isPublic: boolean
  ) => Promise<boolean>;
}

export function QuoteForm({ onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full px-3.5 py-3 border border-[var(--border)] rounded-xl bg-transparent text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const success = await onSave(
        bookId,
        pageNumber ? parseInt(pageNumber, 10) : null,
        quoteText.trim(),
        notes.trim() || null,
        tags,
        isPublic
      );

      if (success) {
        // Reset form
        setQuoteText("");
        setNotes("");
        setPageNumber("");
        setTags([]);
        setBookId(null);
        setIsPublic(false);
        setIsOpen(false);
      } else {
        setError("Ocurrió un error al guardar la cita.");
      }
    } catch (err) {
      setError("Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden transition-colors mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-[var(--fg)] hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-base">
          <Plus size={18} className="text-[var(--accent)]" />
          Agregar una cita nueva
        </span>
        {isOpen ? <ChevronUp size={18} className="text-[var(--muted)]" /> : <ChevronDown size={18} className="text-[var(--muted)]" />}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-1 border-t border-[var(--border)] flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">Libro</label>
                <BookPicker value={bookId} onChange={setBookId} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">Cita textual *</label>
                <textarea
                  required
                  placeholder="«Escribe aquí el fragmento destacado del libro...»"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  rows={4}
                  className={`${inputClass} font-[family-name:var(--font-fraunces)] italic text-base leading-relaxed resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">Página (opcional)</label>
                  <input
                    type="number"
                    placeholder="Ej. 142"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">Tags</label>
                  <TagInput value={tags} onChange={setTags} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">Tus notas / Interpretación</label>
                <textarea
                  placeholder="¿Por qué te llamó la atención? ¿Qué significa para ti?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <PublicToggle value={isPublic} onChange={setIsPublic} />

              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving || !quoteText.trim()}
                  className="flex-1 py-3 bg-[var(--fg)] text-[var(--bg)] text-sm font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {saving ? "Guardando..." : "Guardar cita"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 border border-[var(--border)] text-sm font-medium text-[var(--muted)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--fg)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
