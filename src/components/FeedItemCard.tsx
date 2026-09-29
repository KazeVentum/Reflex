"use client";
import { Mic } from "lucide-react";
import type { FeedReflection, FeedQuote } from "@/types";
import { AudioPlayer } from "@/components/AudioPlayer";

type Props =
  | { type: "reflection"; item: FeedReflection }
  | { type: "quote"; item: FeedQuote };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

export function FeedItemCard({ type, item }: Props) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{formatDate(item.created_at)}</span>
        {item.page_number && <span>p. {item.page_number}</span>}
      </div>

      {type === "reflection" ? (
        <>
          <div className="flex items-center gap-2 text-[var(--fg)]">
            <Mic size={16} strokeWidth={1.8} />
            <p className="font-[family-name:var(--font-fraunces)]">
              {item.title ?? "Reflexión de voz"}
            </p>
          </div>
          <AudioPlayer audioPath={item.audio_path} durationSeconds={item.duration_seconds} />
          {item.notes && <p className="text-sm text-[var(--muted)] leading-relaxed">{item.notes}</p>}
        </>
      ) : (
        <p className="font-[family-name:var(--font-fraunces)] italic leading-relaxed text-[var(--fg)]">
          {item.quote_text}
        </p>
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
    </div>
  );
}
