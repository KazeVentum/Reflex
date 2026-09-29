"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useFeaturedProfiles } from "@/lib/hooks/useFeaturedProfiles";

export default function FeedPage() {
  const { profiles, loading } = useFeaturedProfiles();

  return (
    <>
      <Sidebar />
      <main className="min-h-screen flex flex-col px-5 pt-10 pb-36 max-w-md md:max-w-3xl mx-auto w-full md:pl-64 md:pb-16 md:pt-16 xl:max-w-5xl 2xl:max-w-7xl">
        <motion.h1
          className="font-[family-name:var(--font-fraunces)] text-2xl md:text-3xl text-[var(--fg)] mb-6 md:mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Autores destacados
        </motion.h1>

        {loading && <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>}
        {!loading && profiles.length === 0 && (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            Aún no hay autores destacados.
          </p>
        )}
        {!loading && profiles.length > 0 && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/feed/${p.id}`}
                className="border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] transition-colors"
              >
                <p className="font-[family-name:var(--font-fraunces)] text-[var(--fg)]">
                  {p.display_name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
