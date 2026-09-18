"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBytes, formatKeyInput, ICON_GRADIENTS, formatDate } from "@/lib/ui";
import type { GradientKey } from "@/types";

type ValidResult = {
  ok: true;
  app: { name: string; version: string; fileSize: number; icon: string; color: GradientKey };
  downloadsLeft: number;
  expiresAt: string | null;
};

type State =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "error"; message: string }
  | { phase: "valid"; result: ValidResult; key: string };

export default function DownloadPage() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function validate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!key.trim()) {
      setState({ phase: "error", message: "Please enter your license key." });
      return;
    }
    setState({ phase: "checking" });
    try {
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({ phase: "valid", result: data, key });
      } else {
        setState({ phase: "error", message: data.error || "This key could not be validated." });
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="wrap" style={{ paddingTop: 80, paddingBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p className="section-label rise" style={{ marginBottom: 14 }}>
        Customer download
      </p>
      <h1 className="display rise d1" style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, margin: 0, textAlign: "center" }}>
        Unlock your <span className="grad-text">download</span>
      </h1>
      <p className="muted rise d2" style={{ fontSize: 16, marginTop: 14, textAlign: "center", maxWidth: 480, lineHeight: 1.65 }}>
        Enter the license key you received after purchase. Your app will unlock instantly.
      </p>

      <div className="card rise d3" style={{ width: "100%", maxWidth: 560, marginTop: 42, padding: "34px 34px 30px" }}>
        <form onSubmit={validate}>
          <div className="field">
            <label htmlFor="key">License key</label>
            <input
              id="key"
              className="input key-input"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={key}
              onChange={(e) => {
                setKey(formatKeyInput(e.target.value));
                if (state.phase === "error") setState({ phase: "idle" });
              }}
              maxLength={19}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={state.phase === "checking"} style={{ width: "100%" }}>
            {state.phase === "checking" ? (
              <>
                <span className="spinner" /> Verifying key…
              </>
            ) : (
              "Validate key"
            )}
          </button>
        </form>

        {state.phase === "error" && (
          <div
            className="shake"
            style={{
              marginTop: 20,
              padding: "13px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,92,122,0.35)",
              background: "rgba(255,92,122,0.08)",
              color: "#ff8ba0",
              fontSize: 14,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span aria-hidden>⚠️</span> {state.message}
          </div>
        )}

        {state.phase === "valid" && (
          <div className="rise" style={{ marginTop: 24 }}>
            <div
              style={{
                border: "1px solid rgba(61,220,151,0.3)",
                background: "rgba(61,220,151,0.06)",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="app-icon app-icon-sm" style={{ background: ICON_GRADIENTS[state.result.app.color] }} aria-hidden>
                  {state.result.app.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="display" style={{ fontSize: 19, fontWeight: 650 }}>
                    {state.result.app.name}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                    v{state.result.app.version} · {formatBytes(state.result.app.fileSize)}
                    {state.result.expiresAt ? ` · key valid until ${formatDate(state.result.expiresAt)}` : ""}
                  </div>
                </div>
                <span className="pill pill-ok">Key valid</span>
              </div>

              <a
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 18 }}
                href={`/api/download/${encodeURIComponent(state.key)}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M4 21h16" />
                </svg>
                Download now
              </a>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: "center" }}>
                {state.result.downloadsLeft} download{state.result.downloadsLeft === 1 ? "" : "s"} remaining on this key
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="faint rise d4" style={{ fontSize: 13.5, marginTop: 28 }}>
        Don&apos;t have a key?{" "}
        <Link href="/#apps" style={{ color: "var(--accent)", textDecoration: "none" }}>
          Browse the catalog
        </Link>{" "}
        to get one.
      </p>
    </div>
  );
}
