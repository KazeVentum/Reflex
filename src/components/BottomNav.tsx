"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, BookOpen, Library, Users } from "lucide-react";

const MotionLink = motion.create(Link);

export function BottomNav() {
  const pathname = usePathname();

  // Inactivos: círculos parejos, solo ícono. El seleccionado se expande
  // para mostrar su nombre al lado — así la píldora completa es angosta
  // la mayoría del tiempo (solo un ítem lleva texto) en vez de cargar las
  // 4 etiquetas siempre, que es lo que la hacía demasiado ancha. `layout`
  // acá es el caso legítimo (un solo ítem cambiando su propio tamaño, no
  // una lista reordenándose) para que el cambio de ancho/padding se anime
  // junto con la etiqueta en vez de saltar de golpe.
  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = pathname === href;
    return (
      <MotionLink
        href={href}
        aria-label={label}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        whileTap={{ scale: 0.92 }}
        className={`flex items-center justify-center h-11 rounded-full overflow-hidden ${
          active
            ? "px-4 gap-2 text-[var(--accent)] bg-[var(--bg)]"
            : "w-11 text-[var(--muted)] hover:text-[var(--fg)]"
        }`}
        style={{ transitionProperty: "color", transitionDuration: "0.2s" }}
      >
        {icon}
        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="text-[12px] font-medium leading-none whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </MotionLink>
    );
  };

  return (
    <nav
      className="md:hidden fixed left-0 right-0 z-50 flex items-center gap-1 p-1 rounded-full border border-[var(--border)] bg-[var(--surface)] w-fit max-w-[calc(100vw-2rem)] mx-auto"
      style={{
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        bottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      {navItem("/library", <Library size={20} strokeWidth={1.8} />, "Biblioteca")}
      {navItem("/", <Mic size={20} strokeWidth={1.8} />, "Grabar")}
      {navItem("/books", <BookOpen size={20} strokeWidth={1.8} />, "Libros")}
      {navItem("/feed", <Users size={20} strokeWidth={1.8} />, "Feed")}
    </nav>
  );
}
