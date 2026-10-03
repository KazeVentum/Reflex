"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, BookOpen, Library, Users, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useIsAdmin();

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-1.5 w-24 py-3 rounded-full transition-colors ${
          active
            ? "text-[var(--accent)] bg-[var(--bg)]"
            : "text-[var(--muted)] hover:text-[var(--fg)]"
        }`}
      >
        {icon}
        <span className="text-[11px] font-medium leading-none">{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="md:hidden fixed left-0 right-0 z-50 flex items-center gap-1 p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] w-fit mx-auto"
      style={{
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        bottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      {navItem("/library", <Library size={22} strokeWidth={1.8} />, "Biblioteca")}
      {navItem("/", <Mic size={22} strokeWidth={1.8} />, "Grabar")}
      {navItem("/books", <BookOpen size={22} strokeWidth={1.8} />, "Libros")}
      {navItem("/feed", <Users size={22} strokeWidth={1.8} />, "Feed")}
      {isAdmin && navItem("/admin/users", <ShieldCheck size={22} strokeWidth={1.8} />, "Admin")}
    </nav>
  );
}
