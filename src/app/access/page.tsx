"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBytes, formatKeyInput, ICON_GRADIENTS, formatDate } from "@/lib/ui";
import type { DeliveryType, GradientKey } from "@/types";

type ValidResult = {
  ok: true;
  app: {
    name: string;
    version: string;
    fileSize: number;
    icon: string;
    color: GradientKey;
    delivery: DeliveryType;
  };
  downloadsLeft: number;
  expiresAt: string | null;
};

type Launched = { type: DeliveryType; url: string; accessesLeft: number | null };

type State =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "error"; message: string }
  | { phase: "valid"; result: ValidResult; key: string };

export default function AccessPage() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState<Launched | null>(null);
  const [copied, setCopied] = useState(false);

  async function validate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!key.trim()) {
      setState({ phase: "error", message: "Please enter your license key." });
      return;
    }
    setLaunched(null);
    setState({ phase: "checking" });
    try {
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.ok) setState({ phase: "valid", result: data, key });
      else setState({ phase: "error", message: data.error || "This key could not be validated." });
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  async function launch() {
    if (state.phase !== "valid") return;
    setLaunching(true);
    try {
      const res = await fetch("/api/apps/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: state.key }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLaunched(null);
        setState({ phase: "error", message: data.error || "Could not open the app." });
      } else {
        setLaunched(data as Launched);
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    } finally {
      setLaunching(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* user can select manually */
    }
  }

  const app = state.phase === "valid" ? state.result.app : null;

  return (
    <div className="wrap" style={{ paddingTop: 80, paddingBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p className="section-label rise" style={{ marginBottom: 14 }}>
        Customer access
      </p>
      <h1 className="display rise d1" style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, margin: 0, textAlign: "center" }}>
        Unlock <span className="grad-text">your app</span>
      </h1>
      <p className="muted rise d2" style={{ fontSize: 16, marginTop: 14, textAlign: "center", maxWidth: 500, lineHeight: 1.65 }}>
        Enter the license key you received after purchase to start using your application.
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
                setLaunched(null);
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

        {state.phase === "valid" && app && (
          <div className="rise" style={{ marginTop: 24 }}>
            <div
              style={{
                border: "1px solid rgba(61,220,151,0.3)",
                background: "rgba(61,220,151,0.06)",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span className="app-icon app-icon-sm" style={{ background: ICON_GRADIENTS[app.color] }} aria-hidden>
                  {app.icon}
                </span>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div className="display" style={{ fontSize: 19, fontWeight: 650 }}>
                    {app.name}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                    v{app.version}
                    {app.delivery === "webapp" ? " · runs in your browser" : " · unlocks a link"}
                    {state.result.expiresAt ? ` · key valid until ${formatDate(state.result.expiresAt)}` : ""}
                  </div>
                </div>
                <span className="pill pill-ok">Key valid</span>
              </div>

              {!launched ? (
                <>
                  <button className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} onClick={launch} disabled={launching}>
                    {launching ? (
                      <>
                        <span className="spinner" /> Unlocking…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                        {app.delivery === "webapp" ? "Open app" : "Reveal my link"}
                      </>
                    )}
                  </button>
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: "center" }}>
                    {state.result.downloadsLeft} access{state.result.downloadsLeft === 1 ? "" : "es"} remaining on this key
                  </p>
                </>
              ) : (
                <div className="rise" style={{ marginTop: 18 }}>
                  <a className="btn btn-primary" style={{ width: "100%" }} href={launched.url} target="_blank" rel="noopener noreferrer">
                    Open {app.name} ↗
                  </a>
                  {launched.type === "link" && (
                    <div style={{ marginTop: 16 }}>
                      <label className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Your unlocked link
                      </label>
                      <div
                        className="mono"
                        style={{
                          marginTop: 7,
                          padding: "12px 14px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid var(--line)",
                          fontSize: 13,
                          wordBreak: "break-all",
                          lineHeight: 1.6,
                        }}
                      >
                        {launched.url}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => copyLink(launched.url)}>
                        {copied ? "✓ Copied" : "Copy link"}
                      </button>
                    </div>
                  )}
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: "center" }}>
                    {launched.accessesLeft !== null
                      ? `${launched.accessesLeft} access${launched.accessesLeft === 1 ? "" : "es"} remaining on this key`
                      : ""}
                  </p>
                </div>
              )}
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
