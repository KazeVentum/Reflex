"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError("Email o contraseña incorrectos"); setLoading(false); }
      else router.push("/");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else setSuccess("¡Cuenta creada! Ya podés ingresar.");
      setLoading(false);
    }
  };

  const inputClass = "px-4 py-3 border border-[var(--border)] rounded-xl bg-transparent text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--fg)] mb-2">
            Reflex
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {mode === "login" ? "Ingresá tus credenciales" : "Creá tu cuenta personal"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {success && <p className="text-sm text-[var(--accent)]">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-[var(--fg)] text-[var(--bg)] rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity font-medium"
          >
            {loading ? "..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null); }}
          className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-center"
        >
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Ingresá"}
        </button>
      </div>
    </main>
  );
}
