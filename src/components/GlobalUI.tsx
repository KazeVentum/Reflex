"use client";
import { useEffect, useState } from "react";
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
    setDark(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next ? "dark" : "light");
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
      <button
        onClick={toggle}
        aria-label="Cambiar tema"
        className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
      >
        {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      </button>
    </div>
  );
}
