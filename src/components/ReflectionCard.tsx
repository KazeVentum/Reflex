"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Reflection } from "@/types";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BookPicker } from "@/components/BookPicker";
import { TagInput } from "@/components/TagInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  reflection: Reflection;
  onDelete: (id: string, audioPath: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Reflection, "title" | "book_id" | "page_number" | "tags" | "notes" | "is_public">>) => Promise<boolean>;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReflectionCard({ reflection, onDelete, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(reflection.title ?? "");
  const [bookId, setBookId] = useState<string | null>(reflection.book_id);
  const [pageNumber, setPageNumber] = useState(reflection.page_number?.toString() ?? "");
  const [tags, setTags] = useState<string[]>(reflection.tags);
  const [notes, setNotes] = useState(reflection.notes ?? "");
  const [isPublic, setIsPublic] = useState(reflection.is_public);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = () => {
    onDelete(reflection.id, reflection.audio_path);
    setConfirmingDelete(false);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    const ok = await onUpdate(reflection.id, {
      title: title.trim() || null,
      book_id: bookId,
      page_number: pageNumber ? parseInt(pageNumber, 10) : null,
      tags,
      notes: notes.trim() || null,
      is_public: isPublic,
    });
    if (ok) setEditing(false);
    setSaving(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(reflection.title ?? "");
    setBookId(reflection.book_id);
    setPageNumber(reflection.page_number?.toString() ?? "");
    setTags(reflection.tags);
    setNotes(reflection.notes ?? "");
    setIsPublic(reflection.is_public);
    setEditing(false);
  };

  const inputClass = "px-3 py-2.5 border border-[var(--border)] rounded-xl bg-transparent text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div
      onClick={() => !editing && setExpanded((v) => !v)}
      className="border border-[var(--border)] rounded-2xl p-4 transition-colors hover:border-[var(--accent)] cursor-pointer"
    >
      {/* Header — siempre visible */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>{formatDate(reflection.created_at)}</span>
          {reflection.duration_seconds && (
            <span className="tabular-nums">{formatDuration(reflection.duration_seconds)}</span>
          )}
        </div>
        <p className="text-[var(--fg)] font-[family-name:var(--font-fraunces)] truncate">
          {reflection.title ?? <span className="text-[var(--muted)] italic">{reflection.books?.title ?? "Sin título"}</span>}
          {reflection.page_number && (
            <span className="text-[var(--muted)] text-sm ml-2">p. {reflection.page_number}</span>
          )}
        </p>
        {reflection.title && reflection.books?.title && (
          <p className="text-xs text-[var(--muted)] truncate">{reflection.books.title}</p>
        )}
        {reflection.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {reflection.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-[var(--surface)] text-[var(--muted)] rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Panel expandido */}
      <AnimatePresence initial={false}>
        {expanded && !editing && (
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <AudioPlayer audioPath={reflection.audio_path} durationSeconds={reflection.duration_seconds} />
            {reflection.notes && (
              <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed">{reflection.notes}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="flex-1 py-3 text-sm border border-[var(--border)] text-[var(--muted)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--fg)] transition-colors"
              >
                Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                className="flex-1 py-3 text-sm border border-[var(--border)] text-[var(--muted)] rounded-xl hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        )}

        {editing && (
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-[var(--border)]">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dale un nombre a esta reflexión"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Libro</label>
                <BookPicker value={bookId} onChange={setBookId} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Página</label>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="opcional"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Tags</label>
                <TagInput value={tags} onChange={setTags} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
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
                  onClick={(e) => { e.stopPropagation(); setIsPublic((v) => !v); }}
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
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 text-sm bg-[var(--fg)] text-[var(--bg)] rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 text-sm border border-[var(--border)] text-[var(--muted)] rounded-xl hover:border-[var(--accent)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmingDelete}
        title="¿Eliminar esta reflexión?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
