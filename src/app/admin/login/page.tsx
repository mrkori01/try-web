"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
      <div className="card rise" style={{ width: "100%", maxWidth: 420, padding: "38px 36px" }}>
        <div
          className="logo-mark"
          aria-hidden
          style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 22 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>
          Admin dashboard
        </h1>
        <p className="muted" style={{ fontSize: 14, margin: "0 0 26px" }}>
          Enter your admin password to manage apps and license keys.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <p className="shake" style={{ color: "#ff8ba0", fontSize: 13.5, margin: "0 0 14px" }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy || !password}>
            {busy ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
