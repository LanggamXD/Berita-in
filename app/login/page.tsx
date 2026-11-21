"use client";

import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Full navigation so browser immediately commits and sends the cookie to middleware
        window.location.assign("/");
      } else {
        setError(data?.error || data?.message || "Password salah");
        setLoading(false);
      }
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi Wi-Fi / Firewall laptop.");
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-page-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-8 shadow-sm"
        style={{
          backgroundColor: "var(--color-card-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Logo + Title */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-lg select-none shadow-xs"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            B
          </div>
          <div className="text-center">
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Berita<span style={{ color: "var(--color-accent)" }}>-in</span>
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Enter your password to continue
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2"
              style={{
                backgroundColor: "var(--color-page-bg)",
                borderColor: error ? "#ef4444" : "var(--color-border)",
                color: "var(--color-text-primary)",
                // @ts-expect-error CSS variable
                "--tw-ring-color": "var(--color-accent)",
              }}
            />
            {error && (
              <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 shadow-xs cursor-pointer active:opacity-80 touch-manipulation"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </div>
    </main>
  );
}
