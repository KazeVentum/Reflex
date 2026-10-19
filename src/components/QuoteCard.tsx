"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Pencil, Trash2 } from "lucide-react";
import type { Quote } from "@/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  quote: Quote;
  onDelete: (id: string) => void;
  onEdit: (quote: Quote) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function QuoteCard({ quote, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = () => {
    onDelete(quote.id);
    setConfirmingDelete(false);
  };

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="border border-[var(--border)] rounded-2xl bg-[var(--bg)] cursor-pointer transition-colors hover:border-[var(--accent)]/40"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      {/* Cuerpo principal — siempre visible */}
      <div className="p-5 flex flex-col gap-4">
        {/* Cita textual */}
        <div className="relative">
          <span className="absolute -top-2 -left-1 font-[family-name:var(--font-fraunces)] text-5xl text-[var(--accent)] opacity-15 leading-none select-none pointer-events-none">
            "
          </span>
          <p className="font-[family-name:var(--font-fraunces)] text-base italic leading-relaxed text-[var(--fg)] pt-3 pl-1">
            {quote.quote_text}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-start justify-between gap-3 text-xs text-[var(--muted)]">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            {quote.books?.title && (
              <span className="font-medium text-[var(--fg)] truncate">
                {quote.books.title}
              </span>
            )}
            {quote.books?.author && (
              <span className="truncate">— {quote.books.author}</span>
            )}
            {!quote.books && (
              <span className="italic">Sin libro asociado</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
            <span className="whitespace-nowrap">{formatDate(quote.created_at)}</span>
            {quote.is_public && (
              <span className="flex items-center gap-1 text-[var(--accent)] whitespace-nowrap">
                <Globe size={11} strokeWidth={1.8} />
                Pública
              </span>
            )}
            {quote.page_number && (
              <span className="text-[var(--accent)] font-medium whitespace-nowrap">p. {quote.page_number}</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {quote.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quote.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[11px] bg-[var(--surface)] text-[var(--muted)] rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Panel expandido */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[var(--border)]">
              {/* Notas */}
              {quote.notes && (
                <div className="pt-4 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">
                    Tu interpretación
                  </span>
                  <p className="text-sm text-[var(--fg)] leading-relaxed">{quote.notes}</p>
                </div>
              )}

              {/* Acciones — visualmente distintas */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(quote); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border border-[var(--border)] text-[var(--fg)] rounded-2xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Pencil size={15} />
                  Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border border-[var(--danger)]/30 text-[var(--danger)] rounded-2xl hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 transition-colors"
                >
                  <Trash2 size={15} />
                  Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmingDelete}
        title="¿Eliminar esta cita?"
        description="Se eliminará de forma permanente."
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
