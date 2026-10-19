"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookPicker } from "@/components/BookPicker";
import { TagInput } from "@/components/TagInput";
import { PublicToggle } from "@/components/PublicToggle";
import { useBooks } from "@/lib/hooks/useBooks";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  // Sin audio = reflexión escrita: el texto va en `notes` y es obligatorio.
  audioBlob?: Blob;
  duration?: number;
  initialBookId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function ReflectionForm({ audioBlob, duration, initialBookId, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const { books } = useBooks();
  // Si estás leyendo un solo libro, lo más probable es que la reflexión sea sobre ese.
  const [bookId, setBookId] = useState<string | null>(() => {
    if (initialBookId) return initialBookId;
    const reading = books.filter((b) => b.current_page > 0 && (b.total_pages === null || b.current_page < b.total_pages));
    return reading.length === 1 ? reading[0].id : null;
  });
  const [pageNumber, setPageNumber] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const isWritten = !audioBlob;

  const previewUrl = useMemo(() => (audioBlob ? URL.createObjectURL(audioBlob) : null), [audioBlob]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const canSave = !isWritten || notes.trim().length > 0;

  const inputClass = "px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const reflectionId = crypto.randomUUID();
      let path: string | null = null;
      if (audioBlob) {
        const ext = audioBlob.type.includes("mp4") ? "mp4"
          : audioBlob.type.includes("ogg") ? "ogg"
          : "webm";
        path = `${user.id}/${reflectionId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("reflections")
          .upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm" });
        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabase.from("reflections").insert({
        id: reflectionId,
        user_id: user.id,
        title: title.trim() || null,
        book_id: bookId,
        page_number: pageNumber ? parseInt(pageNumber, 10) : null,
        audio_path: path,
        duration_seconds: audioBlob ? duration ?? null : null,
        tags,
        notes: notes.trim() || null,
        is_public: isPublic,
      });
      if (insertError) throw insertError;

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setSaving(false);
    }
  };

  const labelClass = "text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]";

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 pb-20">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] mb-1">
          {isWritten ? "Reflexión escrita" : `Reflexión de voz${duration ? ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : ""}`}
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)]">
          {isWritten ? "¿Qué te dejó esta lectura?" : "Guarda tu reflexión"}
        </h2>
      </div>

      <div
        className="flex flex-col gap-5 p-5 md:p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
        style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.10)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_88px] gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className={labelClass}>Libro</label>
            <BookPicker value={bookId} onChange={setBookId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Página</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="—"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} w-24 sm:w-full text-center`}
            />
          </div>
        </div>

        <input
          type="text"
          placeholder={isWritten ? "Título (opcional)" : "Dale un nombre a esta reflexión"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-[var(--border)] pb-2 font-[family-name:var(--font-fraunces)] text-xl text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />

        {previewUrl && (
          <div className="-mt-3">
            <AudioPlayer src={previewUrl} durationSeconds={duration} />
          </div>
        )}

        {isWritten ? (
          <textarea
            autoFocus
            placeholder="Una reseña, una idea que no puedes soltar, una pregunta que te dejó..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            className="w-full bg-transparent resize-y font-[family-name:var(--font-fraunces)] text-base md:text-lg leading-relaxed text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none"
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Notas</label>
            <textarea
              placeholder="Escribe una nota sobre esta reflexión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border)]">
          <label className={labelClass}>Tags</label>
          <TagInput value={tags} onChange={setTags} />
        </div>

        <PublicToggle value={isPublic} onChange={setIsPublic} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex-1 py-3.5 bg-[var(--fg)] text-[var(--bg)] text-sm font-medium rounded-xl hover:opacity-85 disabled:opacity-40 transition-opacity"
        >
          {saving ? "Guardando..." : isPublic ? "Guardar y publicar" : "Guardar"}
        </button>
        <button
          onClick={() => (isWritten && !notes.trim() ? onCancel() : setConfirmingDiscard(true))}
          disabled={saving}
          className="px-6 py-3.5 border border-[var(--border)] text-sm text-[var(--muted)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--fg)] disabled:opacity-50 transition-colors"
        >
          {isWritten ? "Cancelar" : "Descartar"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDiscard}
        title={isWritten ? "¿Descartar lo que escribiste?" : "¿Descartar esta grabación?"}
        description="Se perderá y no podrás recuperarla."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        onConfirm={() => { setConfirmingDiscard(false); onCancel(); }}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </div>
  );
}
