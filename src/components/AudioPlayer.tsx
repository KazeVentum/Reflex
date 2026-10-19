"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

function formatTime(s: number): string {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface Props {
  // audioPath = archivo en Storage; src = URL directa (ej. blob de una
  // grabación que aún no se guardó, para escucharla antes).
  audioPath?: string;
  src?: string;
  durationSeconds?: number | null;
}

export function AudioPlayer({ audioPath, src, durationSeconds }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const url = src ?? signedUrl;
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioPath) return;
    const supabase = createClient();
    supabase.storage
      .from("reflections")
      .createSignedUrl(audioPath, 3600)
      .then(({ data, error }) => {
        if (error || !data) { setError(true); return; }
        setSignedUrl(data.signedUrl);
      });
  }, [audioPath]);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    audio.preload = "metadata";
    audioRef.current = audio;
    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setPlaying(false); setCurrentTime(0); };
    return () => { audio.pause(); audio.src = ""; };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => setError(true)); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = ((e.clientX - rect.left) / rect.width) * duration;
    if (isFinite(next)) audio.currentTime = next;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (error) return <p className="text-sm text-[var(--muted)]">No se pudo cargar el audio.</p>;
  if (!url) return (
    <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-[var(--surface)]">
      <div className="w-9 h-9 rounded-full bg-[var(--border)] animate-pulse flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-1.5 bg-[var(--border)] rounded-full animate-pulse" />
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-[var(--surface)]">
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center flex-shrink-0 hover:opacity-75 transition-opacity"
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div
          className="h-1.5 bg-[var(--border)] rounded-full cursor-pointer overflow-hidden"
          onClick={seek}
        >
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
