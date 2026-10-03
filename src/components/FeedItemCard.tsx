"use client";
import { Mic } from "lucide-react";
import type { FeedReflection, FeedQuote } from "@/types";
import { AudioPlayer } from "@/components/AudioPlayer";

type Props =
  | { type: "reflection"; item: FeedReflection }
  | { type: "quote"; item: FeedQuote };

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

// Anotación al margen, no "card": una barra vertical acompaña cada entrada
// como si fuera una nota escrita al margen de un libro — coherente con que
// esto es, literalmente, un diario de lectura. Separador entre entradas en
// vez de caja con borde + sombra repetida en cada una.
export function FeedItemCard({ type, item }: Props) {
  return (
    <article className="border-l-2 border-[var(--border)] pl-5 py-6 border-b border-b-[var(--border)] last:border-b-0 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{formatRelative(item.created_at)}</span>
        {item.books && <span className="truncate">{item.books.title}</span>}
        {item.page_number && <span className="shrink-0">p. {item.page_number}</span>}
      </div>

      {type === "reflection" ? (
        <>
          <div className="flex items-center gap-2 text-[var(--fg)]">
            <Mic size={16} strokeWidth={1.8} className="text-[var(--accent)] shrink-0" />
            <p className="font-[family-name:var(--font-fraunces)] text-lg">
              {item.title ?? "Reflexión de voz"}
            </p>
          </div>
          <AudioPlayer audioPath={item.audio_path} durationSeconds={item.duration_seconds} />
          {item.notes && <p className="text-sm text-[var(--muted)] leading-relaxed">{item.notes}</p>}
        </>
      ) : (
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-[var(--accent)] text-2xl leading-none mb-2 select-none">
            ❝
          </p>
          <p className="font-[family-name:var(--font-fraunces)] italic text-lg leading-relaxed text-[var(--fg)]">
            {item.quote_text}
          </p>
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 text-[11px] bg-[var(--surface)] text-[var(--muted)] rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
