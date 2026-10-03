"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Feather, Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useFeaturedProfiles } from "@/lib/hooks/useFeaturedProfiles";
import { useProfileSearch } from "@/lib/hooks/useProfileSearch";
import type { Profile } from "@/types";

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link
      href={`/feed/${profile.id}`}
      className="border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] transition-colors"
    >
      <p className="flex items-center gap-1.5 font-[family-name:var(--font-fraunces)] text-[var(--fg)]">
        {profile.display_name}
        {profile.is_verified && (
          <Feather size={14} strokeWidth={1.8} className="text-[var(--accent)] shrink-0" />
        )}
      </p>
    </Link>
  );
}

export default function FeedPage() {
  const [query, setQuery] = useState("");
  const { profiles, loading } = useFeaturedProfiles();
  const { results, loading: searching } = useProfileSearch(query);
  const isSearching = query.trim().length > 0;

  return (
    <>
      <Sidebar />
      <main className="min-h-screen flex flex-col px-5 pt-16 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
        <motion.h1
          className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)] mb-6 md:mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Autores destacados
        </motion.h1>

        <div className="relative mb-6 md:mb-8">
          <Search
            size={16}
            strokeWidth={1.8}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre de usuario..."
            className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {isSearching ? (
          <>
            {searching && <p className="text-sm text-[var(--muted)] text-center py-12">Buscando...</p>}
            {!searching && results.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-12">
                Sin resultados para &ldquo;{query.trim()}&rdquo;.
              </p>
            )}
            {!searching && results.length > 0 && (
              <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {loading && <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>}
            {!loading && profiles.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-12">
                Aún no hay autores destacados.
              </p>
            )}
            {!loading && profiles.length > 0 && (
              <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
                {profiles.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
