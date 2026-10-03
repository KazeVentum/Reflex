"use client";
import { motion } from "framer-motion";
import { Feather } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { useProfiles } from "@/lib/hooks/useProfiles";

function FlagSwitch({
  label,
  checked,
  onToggle,
  ariaLabel,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked
            ? "bg-[var(--accent)] border-[var(--accent)]"
            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        <span
          className="absolute top-1 left-1 h-4 w-4 rounded-full transition-transform"
          style={{
            transform: checked ? "translateX(20px)" : "none",
            backgroundColor: checked ? "var(--bg)" : "var(--muted)",
          }}
        />
      </button>
    </div>
  );
}

export default function AdminUsersPage() {
  const { isAdmin, loading: loadingAdmin } = useIsAdmin();
  const { profiles, loading, toggleFeatured, toggleVerified } = useProfiles();

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
                      <span className="flex items-center gap-1.5 text-sm text-[var(--fg)] truncate">
                        {p.display_name ?? p.email}
                        {p.is_verified && (
                          <Feather size={13} strokeWidth={1.8} className="text-[var(--accent)] shrink-0" />
                        )}
                      </span>
                      <span className="text-xs text-[var(--muted)] truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <FlagSwitch
                        label="Destacado"
                        checked={p.is_featured}
                        onToggle={() => toggleFeatured(p.id, !p.is_featured)}
                        ariaLabel={`Destacar a ${p.display_name ?? p.email}`}
                      />
                      <FlagSwitch
                        label="Verificado"
                        checked={p.is_verified}
                        onToggle={() => toggleVerified(p.id, !p.is_verified)}
                        ariaLabel={`Verificar a ${p.display_name ?? p.email}`}
                      />
                    </div>
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
