"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRecorder } from "@/lib/hooks/useRecorder";
import { useBooks } from "@/lib/hooks/useBooks";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useMyProfile } from "@/lib/hooks/useMyProfile";
import { ReflectionForm } from "@/components/ReflectionForm";
import { BottomNav } from "@/components/BottomNav";
import { RecordButton } from "@/components/RecordButton";
import { BookProgressBar } from "@/components/BookProgressBar";
import { PageUpdateSheet } from "@/components/PageUpdateSheet";
import { Sidebar } from "@/components/Sidebar";
import type { Book } from "@/types";

const PROMPTS = [
  "¿Qué pensamiento no puedes soltar después de hoy?",
  "¿Qué frase resonó más contigo esta noche?",
  "¿Qué cambiaría si aplicaras lo que leíste?",
  "¿Con qué personaje o idea te identificaste?",
  "¿Qué pregunta te dejó el libro de hoy?",
  "¿Qué querrías recordar de esta lectura en diez años?",
  "¿Qué emoción despertó en ti esta lectura?",
];

const QUOTES = [
  { text: "Un libro es un sueño que tienes en tus manos.", author: "Neil Gaiman" },
  { text: "El lector vive mil vidas antes de morir.", author: "George R.R. Martin" },
  { text: "No hay mejor almohada que un buen libro.", author: "Charles Kingsley" },
  { text: "Los libros son espejos: solo ves en ellos lo que ya tienes dentro.", author: "Carlos Ruiz Zafón" },
  { text: "Leer es retirarse a pensar.", author: "Voltaire" },
  { text: "El libro es el único lugar donde la mente se detiene.", author: "Anónimo" },
  { text: "La lectura es una conversación con los mejores pensadores de la historia.", author: "Descartes" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getDate(): string {
  const d = new Date().toLocaleDateString("es", {
    weekday: "long", day: "numeric", month: "long",
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function getDayIndex(len: number): number {
  return new Date().getDate() % len;
}

function BooksInProgress({ onOpenSheet }: { onOpenSheet: (book: Book) => void }) {
  const { books } = useBooks();
  const tracked = books.filter((b) => b.total_pages !== null);

  if (tracked.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="flex flex-col gap-3"
    >
      <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">En progreso</p>
      {tracked.map((book) => (
        <div
          key={book.id}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
        >
          <div className="min-w-0 mb-3">
            <p className="font-[family-name:var(--font-fraunces)] text-[var(--fg)]">{book.title}</p>
            {book.author && <p className="text-xs text-[var(--muted)] truncate mt-0.5">{book.author}</p>}
          </div>
          <BookProgressBar current={book.current_page} total={book.total_pages} className="mb-3" />
          <button
            onClick={() => onOpenSheet(book)}
            className="w-full px-4 py-2.5 text-sm font-medium text-[var(--bg)] bg-[var(--accent)] rounded-xl hover:opacity-85 active:opacity-80 transition-opacity"
          >
            {book.current_page === 0 ? "Iniciar" : "Actualizar"}
          </button>
        </div>
      ))}
    </motion.div>
  );
}

export default function Home() {
  const { state, audioBlob, duration, elapsed, start, stop, reset } = useRecorder();
  const { updateCurrentPage } = useBooks();
  const router = useRouter();
  const { quotes } = useQuotes();
  const { profile } = useMyProfile();
  const [sheetBook, setSheetBook] = useState<Book | null>(null);

  const combinedQuotes = useMemo(() => {
    const userQuotes = quotes.map((q) => ({
      text: q.quote_text,
      author: q.books
        ? `${q.books.title}${q.books.author ? ` (${q.books.author})` : ""}${q.page_number ? `, p. ${q.page_number}` : ""}`
        : "Mi cita",
    }));
    return [...userQuotes, ...QUOTES];
  }, [quotes]);

  const quote = combinedQuotes[getDayIndex(combinedQuotes.length)];
  const prompt = PROMPTS[getDayIndex(PROMPTS.length)];

  const handleSaved = () => {
    reset();
    router.push("/library");
  };

  if (state === "done" && audioBlob) {
    return (
      <>
        <Sidebar />
        <motion.main
          className="min-h-screen flex flex-col px-5 pt-16 pb-36 max-w-md md:max-w-2xl mx-auto w-full md:pl-64 md:pb-16 md:pt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ReflectionForm audioBlob={audioBlob} duration={duration} onSaved={handleSaved} onCancel={reset} />
          <BottomNav />
        </motion.main>
      </>
    );
  }

  return (
    <>
    <Sidebar />
    <main className="min-h-screen flex flex-col px-5 pt-14 pb-36 max-w-md md:max-w-4xl mx-auto w-full gap-4 md:pl-64 md:pb-16 md:pt-20 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-0.5">{getDate()}</p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-[var(--fg)]">
          {getGreeting()}{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
      </motion.div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-[2fr_1fr] md:grid-rows-[auto_auto] md:gap-x-6 md:gap-y-4 md:items-start">
        <div className="order-1 md:order-none flex flex-col gap-4 md:col-start-1 md:row-start-1">
          {/* Quote card */}
          <motion.div
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-7"
            style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.10)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="font-[family-name:var(--font-fraunces)] text-[var(--accent)] text-3xl leading-none mb-3 select-none">❝</p>
            <p className="font-[family-name:var(--font-fraunces)] text-[var(--fg)] text-base md:text-lg leading-relaxed italic mb-3">
              {quote.text}
            </p>
            <p className="text-xs text-[var(--muted)]">— {quote.author}</p>
          </motion.div>

          {/* Reflection prompt */}
          <motion.div
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 md:px-7 md:py-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] mb-1.5">Reflexión de esta noche</p>
            <p className="text-sm text-[var(--fg)] leading-relaxed">{prompt}</p>
          </motion.div>
        </div>

        {/* Books in progress */}
        <div className="order-3 md:order-none md:col-start-2 md:row-start-1 md:sticky md:top-10">
          <BooksInProgress onOpenSheet={setSheetBook} />
        </div>

        {/* Hold-to-record — centrado en todo el ancho del contenido */}
        <motion.div
          className="order-2 md:order-none flex flex-col items-center gap-4 py-2 md:py-8 md:col-start-1 md:col-span-2 md:row-start-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RecordButton state={state} onStart={start} onStop={stop} />
          <AnimatePresence mode="wait">
            <motion.p
              key={state}
              className="text-xs text-[var(--muted)] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {state === "recording"
                ? `Grabando… ${elapsed}s`
                : "Toca para capturar un pensamiento"}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>

      <PageUpdateSheet
        book={sheetBook}
        onClose={() => setSheetBook(null)}
        onUpdate={updateCurrentPage}
      />

      <BottomNav />
    </main>
    </>
  );
}
