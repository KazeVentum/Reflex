"use client";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { useProfiles } from "@/lib/hooks/useProfiles";

export default function AdminUsersPage() {
  const { isAdmin, loading: loadingAdmin } = useIsAdmin();
  const { profiles, loading, toggleFeatured } = useProfiles();

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
          Usuarios
        </motion.h1>

        {loadingAdmin && (
          <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>
        )}

        {!loadingAdmin && !isAdmin && (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            No tienes autorización para ver esta página.
          </p>
        )}

        {!loadingAdmin && isAdmin && (
          <>
            {loading && (
              <p className="text-sm text-[var(--muted)] text-center py-12">Cargando...</p>
            )}
            {!loading && profiles.length === 0 && (
              <p className="text-sm text-[var(--muted)] text-center py-12">
                No hay usuarios registrados.
              </p>
            )}
            {!loading && profiles.length > 0 && (
              <div className="flex flex-col divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden">
                {profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-[var(--fg)] truncate">
                        {p.display_name ?? p.email}
                      </span>
                      <span className="text-xs text-[var(--muted)] truncate">{p.email}</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.is_featured}
                      aria-label={`Destacar a ${p.display_name ?? p.email}`}
                      onClick={() => toggleFeatured(p.id, !p.is_featured)}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                        p.is_featured
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <span
                        className="absolute top-1 left-1 h-4 w-4 rounded-full transition-transform"
                        style={{
                          transform: p.is_featured ? "translateX(20px)" : "none",
                          backgroundColor: p.is_featured ? "var(--bg)" : "var(--muted)",
                        }}
                      />
                    </button>
                  </div>
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
