"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Feather, Pencil } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useAuthorFeed } from "@/lib/hooks/useAuthorFeed";
import { useMyProfile } from "@/lib/hooks/useMyProfile";
import { FeedItemCard } from "@/components/FeedItemCard";
import type { FeedReflection, FeedQuote } from "@/types";

type Entry =
  | { type: "reflection"; item: FeedReflection }
  | { type: "quote"; item: FeedQuote };

export default function AuthorFeedPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const { profile, reflections, quotes, loading } = useAuthorFeed(authorId);
  const { profile: myProfile, updateDisplayName } = useMyProfile();
  const isOwnProfile = !!myProfile && myProfile.id === authorId;

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setNameDraft(profile?.display_name ?? "");
  }, [profile?.display_name]);

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setSavingName(true);
    const ok = await updateDisplayName(trimmed);
    setSavingName(false);
    if (ok) setEditingName(false);
  };

  // Un muro cronológico único, no agrupado por libro: el libro queda como
  // una etiqueta dentro de cada entrada (ver FeedItemCard), no como
  // encabezado de sección — así se lee como el perfil de una persona, no
  // como un índice de sus libros.
  const entries = useMemo<Entry[]>(() => {
    const combined: Entry[] = [
      ...reflections.map((item): Entry => ({ type: "reflection", item })),
      ...quotes.map((item): Entry => ({ type: "quote", item })),
    ];
    return combined.sort(
      (a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime()
    );
  }, [reflections, quotes]);

  const bookCount = useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) if (e.item.books) ids.add(e.item.books.id);
    return ids.size;
  }, [entries]);

  const statParts = [
    reflections.length > 0 && `${reflections.length} ${reflections.length === 1 ? "reflexión" : "reflexiones"}`,
    quotes.length > 0 && `${quotes.length} ${quotes.length === 1 ? "cita" : "citas"}`,
    bookCount > 0 && `${bookCount} ${bookCount === 1 ? "libro" : "libros"}`,
  ].filter(Boolean);

  return (
    <>
      <Sidebar />
      <main className="min-h-screen flex flex-col px-5 pt-16 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
        {loading && <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>}

        {!loading && !profile && (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            Este autor no está disponible.
          </p>
        )}

        {!loading && profile && (
          // max-w acá, no en <main>: así el bloque queda anclado a la
          // izquierda igual que el resto de la app (todas las páginas usan
          // el mismo <main> ancho + sidebar), en vez de flotar centrado con
          // un hueco asimétrico a la derecha.
          <div className="max-w-2xl">
            <motion.div
              className="border-l-4 border-[var(--accent)] pl-5 md:pl-6 pb-8 mb-8 border-b border-b-[var(--border)]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={40}
                    autoFocus
                    className="flex-1 min-w-0 font-[family-name:var(--font-fraunces)] text-3xl md:text-5xl text-[var(--fg)] bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName || !nameDraft.trim()}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-[var(--accent)] text-[var(--bg)] hover:opacity-85 disabled:opacity-50 transition-opacity"
                  >
                    {savingName ? "..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingName(false); setNameDraft(profile.display_name ?? ""); }}
                    className="px-3 py-2 text-xs rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <h1 className="flex items-center gap-2.5 min-w-0 font-[family-name:var(--font-fraunces)] text-3xl md:text-5xl text-[var(--fg)]">
                  <span className="break-words">{profile.display_name}</span>
                  {profile.is_verified && (
                    <Feather size={24} strokeWidth={1.8} className="text-[var(--accent)] shrink-0" />
                  )}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      aria-label="Editar tu nombre público"
                      className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <Pencil size={16} strokeWidth={1.8} />
                    </button>
                  )}
                </h1>
              )}
              {statParts.length > 0 && (
                <p className="text-sm text-[var(--muted)] mt-2">{statParts.join(" · ")}</p>
              )}
            </motion.div>

            {entries.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-12">
                Sin contenido público todavía.
              </p>
            )}

            <div className="flex flex-col">
              {entries.map((e) =>
                e.type === "reflection" ? (
                  <FeedItemCard key={e.item.id} type="reflection" item={e.item} />
                ) : (
                  <FeedItemCard key={e.item.id} type="quote" item={e.item} />
                )
              )}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
