"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useBooks } from "@/lib/hooks/useBooks";
import { useReadingLogs } from "@/lib/hooks/useReadingLogs";
import { BottomNav } from "@/components/BottomNav";
import { BookProgressBar } from "@/components/BookProgressBar";
import { ReadingHeatmap } from "@/components/ReadingHeatmap";
import { ReadingHistory } from "@/components/ReadingHistory";
import { PageUpdateSheet } from "@/components/PageUpdateSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Sidebar } from "@/components/Sidebar";
import type { Book } from "@/types";

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  exit: { opacity: 0, x: -20, scale: 0.97, transition: { duration: 0.2 } },
};

function BookRow({
  book,
  onUpdate,
  onDelete,
  onOpenSheet,
}: {
  book: Book;
  onUpdate: (id: string, title: string, author?: string, totalPages?: number) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenSheet: (book: Book) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? "");
  const [totalPages, setTotalPages] = useState(book.total_pages?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const tp = totalPages ? parseInt(totalPages, 10) : undefined;
    const ok = await onUpdate(book.id, title.trim(), author.trim() || undefined, tp);
    if (ok) setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setTitle(book.title);
    setAuthor(book.author ?? "");
    setTotalPages(book.total_pages?.toString() ?? "");
    setEditing(false);
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-transparent text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="md:border md:border-[var(--border)] md:rounded-2xl md:bg-[var(--surface)] md:overflow-hidden">
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="editing"
            className="flex flex-col gap-2 py-4 border-b border-[var(--border)] md:border-b-0 md:p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className={inputClass} autoFocus />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor (opcional)" className={inputClass} />
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Total de páginas (opcional)"
              className={inputClass}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex-1 py-3 text-sm bg-[var(--fg)] text-[var(--bg)] rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {saving ? "..." : "Guardar"}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 text-sm border border-[var(--border)] text-[var(--muted)] rounded-xl hover:border-[var(--accent)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            className="flex flex-col py-4 border-b border-[var(--border)] gap-3 md:border-b-0 md:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[var(--fg)] font-[family-name:var(--font-fraunces)]">{book.title}</span>
                {book.author && <span className="text-sm text-[var(--muted)] truncate">{book.author}</span>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  aria-label="Editar"
                  title="Editar"
                  className="p-2 text-[var(--muted)] border border-[var(--border)] rounded-lg hover:text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Eliminar"
                  title="Eliminar"
                  className="p-2 text-[var(--muted)] border border-[var(--border)] rounded-lg hover:text-[var(--danger)] hover:border-[var(--danger)] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <BookProgressBar current={book.current_page} total={book.total_pages} />
              <button
                onClick={() => onOpenSheet(book)}
                className="self-start px-4 py-2 text-xs font-medium text-[var(--accent)] border border-[var(--accent)]/40 rounded-xl hover:bg-[var(--accent)]/10 transition-colors"
              >
                {book.current_page === 0
                  ? "Iniciar"
                  : book.total_pages !== null && book.current_page >= book.total_pages
                    ? "Editar progreso"
                    : "Actualizar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmingDelete}
        title={`¿Eliminar "${book.title}"?`}
        description="Se eliminará el libro y su progreso de lectura de forma permanente."
        onConfirm={() => { onDelete(book.id); setConfirmingDelete(false); }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </motion.div>
  );
}

function AddBookForm({
  onAdd,
  onClose,
}: {
  onAdd: (title: string, author?: string, totalPages?: number) => Promise<Book | null>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-transparent text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const tp = totalPages ? parseInt(totalPages, 10) : undefined;
    const added = await onAdd(title.trim(), author.trim() || undefined, tp);
    setSaving(false);
    if (added) onClose();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="overflow-hidden"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="flex flex-col gap-2 p-4 mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] md:grid md:grid-cols-[2fr_1.5fr_1fr_auto] md:items-center">
        <input type="text" placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className={inputClass} />
        <input type="text" placeholder="Autor (opcional)" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
        <input
          type="number"
          min={1}
          placeholder="Páginas"
          value={totalPages}
          onChange={(e) => setTotalPages(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2 mt-1 md:mt-0">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 md:flex-none px-5 py-3 bg-[var(--fg)] text-[var(--bg)] text-sm font-medium rounded-xl hover:opacity-85 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 md:flex-none px-4 py-3 border border-[var(--border)] text-sm text-[var(--muted)] rounded-xl hover:border-[var(--accent)] hover:text-[var(--fg)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.form>
  );
}

function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3">
      {children} <span className="text-[var(--accent)]">· {count}</span>
    </p>
  );
}

export default function BooksPage() {
  const { books, loading, addBook, updateBook, deleteBook, updateCurrentPage } = useBooks();
  const { logs, entries } = useReadingLogs();
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();
  const [sheetBook, setSheetBook] = useState<Book | null>(null);

  const isFinished = (b: Book) => b.total_pages !== null && b.current_page >= b.total_pages;
  const reading = books.filter((b) => !isFinished(b));
  const finished = books.filter(isFinished);

  const renderList = (list: Book[]) => (
    <div className="flex flex-col md:gap-4">
      <AnimatePresence initial={false}>
        {list.map((book) => (
          <BookRow
            key={book.id}
            book={book}
            onUpdate={updateBook}
            onDelete={deleteBook}
            onOpenSheet={setSheetBook}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <>
    <Sidebar />
    <main className="min-h-screen flex flex-col px-5 pt-20 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
      <motion.div
        className="flex items-center justify-between gap-3 mb-6 md:mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)]">
          Mis libros
        </h1>
        {!adding && books.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[var(--bg)] bg-[var(--accent)] rounded-xl hover:opacity-85 active:opacity-80 transition-opacity"
          >
            <Plus size={16} />
            Agregar libro
          </button>
        )}
      </motion.div>

      <AnimatePresence initial={false}>
        {adding && <AddBookForm key="add" onAdd={addBook} onClose={() => setAdding(false)} />}
      </AnimatePresence>

      {loading && (
        <motion.p className="text-sm text-[var(--muted)] text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Cargando...
        </motion.p>
      )}

      {!loading && books.length === 0 && !adding && (
        <motion.div
          className="flex flex-col items-center text-center gap-4 py-16 px-6 mb-8 rounded-2xl border border-dashed border-[var(--border)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <BookOpen size={32} strokeWidth={1.5} className="text-[var(--accent)]" />
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--fg)]">Tu estantería está vacía</p>
            <p className="text-sm text-[var(--muted)] mt-1">Agrega el libro que estás leyendo para seguir tu progreso.</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-[var(--bg)] bg-[var(--accent)] rounded-xl hover:opacity-85 transition-opacity"
          >
            <Plus size={16} />
            Agregar tu primer libro
          </button>
        </motion.div>
      )}

      {!loading && books.length > 0 && (
        <motion.div
          className="p-4 md:p-5 rounded-2xl bg-[var(--surface)] mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ReadingHeatmap logs={logs} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </motion.div>
      )}

      {!loading && books.length > 0 && (
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-8 md:items-start">
          <div>
            {reading.length > 0 && (
              <section className="mb-8">
                <SectionLabel count={reading.length}>Leyendo</SectionLabel>
                {renderList(reading)}
              </section>
            )}

            {finished.length > 0 && (
              <section className="mb-8">
                <SectionLabel count={finished.length}>Terminados</SectionLabel>
                {renderList(finished)}
              </section>
            )}
          </div>

          <section className="mb-8 md:sticky md:top-10">
            <ReadingHistory
              entries={entries}
              selectedDate={selectedDate}
              onClearDate={() => setSelectedDate(null)}
            />
          </section>
        </div>
      )}

      <PageUpdateSheet
        book={sheetBook}
        onClose={() => setSheetBook(null)}
        onUpdate={updateCurrentPage}
        onWriteReview={(book) => router.push(`/?escribir=${book.id}`)}
      />

      <BottomNav />
    </main>
    </>
  );
}
