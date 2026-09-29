"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SettingsMenu } from "@/components/SettingsMenu";

export function GlobalUI() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    setMounted(true);
    if (stored === "dark") document.documentElement.classList.add("dark");
    if (stored === "light") document.documentElement.classList.add("light");
  }, []);

  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;

    // Transición de color acotada al momento del cambio: se agrega justo
    // antes y se saca ~200ms después, para no dejar un `transition` viviendo
    // permanentemente (eso hace que hovers/focus/clicks normales también
    // animen y se sientan con lag).
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 250);
    }

    setDark(next);
    root.classList.remove("dark", "light");
    root.classList.add(next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
      {!isLogin && <SettingsMenu />}
      {!isLogin && (
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
        >
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      )}
      <motion.button
        onClick={toggle}
        aria-label="Cambiar tema"
        whileTap={{ scale: 0.9 }}
        className="relative overflow-hidden p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "sun" : "moon"}
            className="flex"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
