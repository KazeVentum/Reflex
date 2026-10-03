"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Settings, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PALETTE_KEY = "palette";
const supabase = createClient();

function applyPalette(pink: boolean) {
  document.documentElement.classList.toggle("pink", pink);
}

/** Menú de configuración de la app (engranaje arriba a la derecha, junto al
 *  toggle de tema). Contiene la paleta "Rosa" y el link al perfil/muro
 *  propio — cualquier usuario puede compartir el suyo, esté o no
 *  destacado por un admin (destacado solo cura el índice /feed). */
export function SettingsMenu() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pink, setPink] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PALETTE_KEY) === "pink";
    setPink(stored);
    applyPalette(stored);
    setMounted(true);
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
    });
  }, []);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSavingName(true);
    setNameError(null);
    setNameSaved(false);
    const { error } = await supabase.rpc("update_my_display_name", { new_name: trimmed });
    setSavingName(false);
    if (error) {
      setNameError("No se pudo guardar. Probá con un nombre más corto.");
      return;
    }
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 2000);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const togglePink = () => {
    const next = !pink;
    const root = document.documentElement;

    // Misma transición acotada que usa el toggle de tema: se agrega justo
    // antes del cambio y se saca ~250ms después, nunca como regla permanente.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 250);
    }

    setPink(next);
    applyPalette(next);
    localStorage.setItem(PALETTE_KEY, next ? "pink" : "default");
  };

  if (!mounted) return null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Configuración"
        aria-expanded={open}
        whileTap={{ scale: 0.9 }}
        className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
      >
        <Settings size={16} strokeWidth={1.8} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 shadow-2xl"
          >
            <p className="font-[family-name:var(--font-fraunces)] text-sm text-[var(--fg)] mb-3">
              Configuración
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-sm text-[var(--fg)]">Tema rosa</span>
                <span className="text-xs text-[var(--muted)]">
                  Cambia la paleta a tonos rosados
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={pink}
                aria-label="Tema rosa"
                onClick={togglePink}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                  pink
                    ? "bg-[var(--accent)] border-[var(--accent)]"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                <span
                  className="absolute top-1 left-1 h-4 w-4 rounded-full transition-transform"
                  style={{
                    transform: pink ? "translateX(20px)" : "none",
                    backgroundColor: pink ? "var(--bg)" : "var(--muted)",
                  }}
                />
              </button>
            </div>

            {userId && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                <label htmlFor="settings-display-name" className="text-sm text-[var(--fg)]">
                  Nombre público
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={40}
                    placeholder="Tu nombre"
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-transparent text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName || !displayName.trim()}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-[var(--accent)] text-[var(--bg)] hover:opacity-85 disabled:opacity-50 transition-opacity"
                  >
                    {savingName ? "..." : "Guardar"}
                  </button>
                </div>
                {nameError && <p className="text-xs text-[var(--danger)]">{nameError}</p>}
                {nameSaved && <p className="text-xs text-[var(--muted)]">Guardado.</p>}
              </div>
            )}

            {userId && (
              <Link
                href={`/feed/${userId}`}
                onClick={() => setOpen(false)}
                className="mt-4 pt-4 flex items-center gap-2.5 border-t border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
              >
                <Link2 size={15} strokeWidth={1.8} />
                Mi perfil público
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
