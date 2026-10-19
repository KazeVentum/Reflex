"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useBooks } from "@/lib/hooks/useBooks";

interface Props {
  value: string | null;
  onChange: (bookId: string | null) => void;
}

export function BookPicker({ value, onChange }: Props) {
  const { books, addBook } = useBooks();
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const book = await addBook(title);
    if (book) {
      onChange(book.id);
      setNewTitle("");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1 min-w-0 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">— Sin libro —</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}{b.author ? ` — ${b.author}` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          aria-label="Crear libro nuevo"
          title="Crear libro nuevo"
          className={`shrink-0 px-3 py-2 border rounded-lg text-sm transition-colors ${
            creating
              ? "border-[var(--accent)] text-[var(--fg)]"
              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
          }`}
        >
          <Plus size={16} />
        </button>
      </div>

      {creating && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Título del libro..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            autoFocus
            className="flex-1 min-w-0 px-3 py-2 border border-[var(--border)] rounded-lg bg-transparent text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="px-3 py-2 bg-[var(--fg)] text-[var(--bg)] text-sm rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Crear
          </button>
        </div>
      )}
    </div>
  );
}
