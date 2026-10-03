"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, BookOpen, Library, Users, User, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { useMyProfile } from "@/lib/hooks/useMyProfile";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useIsAdmin();
  const { profile } = useMyProfile();

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
          active
            ? "bg-[var(--surface)] text-[var(--accent)]"
            : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:shrink-0 md:px-4 md:py-8 md:border-r md:border-[var(--border)] md:bg-[var(--bg)]">
      <p className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--fg)] px-4 mb-8">
        Reflex
      </p>
      <nav className="flex flex-col gap-1">
        {navItem("/", <Mic size={20} strokeWidth={1.8} />, "Grabar")}
        {navItem("/library", <Library size={20} strokeWidth={1.8} />, "Biblioteca")}
        {navItem("/books", <BookOpen size={20} strokeWidth={1.8} />, "Libros")}
        {navItem("/feed", <Users size={20} strokeWidth={1.8} />, "Feed")}
        {profile && navItem(`/feed/${profile.id}`, <User size={20} strokeWidth={1.8} />, "Mi perfil")}
        {isAdmin && navItem("/admin/users", <ShieldCheck size={20} strokeWidth={1.8} />, "Admin")}
      </nav>
    </aside>
  );
}
