import Link from "next/link";
import { readDB } from "@/lib/db";
import { ICON_GRADIENTS, formatBytes, formatPrice, isPlaceholderContact } from "@/lib/ui";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Store" };

export default function StoreFront() {
  const db = readDB();
  const { apps, settings } = db;

  return (
    <div className="wrap">
      {/* ---------- hero ---------- */}
      <section style={{ padding: "96px 0 70px", textAlign: "center", position: "relative" }}>
        <p className="section-label rise" style={{ marginBottom: 18 }}>
          Software marketplace
        </p>
        <h1
          className="display rise d1"
          style={{ fontSize: "clamp(42px, 7vw, 76px)", fontWeight: 700, lineHeight: 1.04, margin: 0 }}
        >
          Sell your software.
          <br />
          <span className="grad-text">Deliver with a key.</span>
        </h1>
        <p
          className="muted rise d2"
          style={{ fontSize: 18, lineHeight: 1.65, maxWidth: 620, margin: "24px auto 0" }}
        >
          {settings.tagline} Browse the catalog below, get a personal license key from the seller,
          and download your app instantly.
        </p>
        <div className="rise d3" style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 38, flexWrap: "wrap" }}>
          <a href="#apps" className="btn btn-primary btn-xl">
            Browse apps
          </a>
          <Link href="/download" className="btn btn-ghost btn-xl">
            I have a key →
          </Link>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section style={{ paddingBottom: 84 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              n: "01",
              t: "Choose an app",
              d: "Pick the application you need from the catalog and check its price and version.",
            },
            {
              n: "02",
              t: "Get your license key",
              d: "Contact the seller to purchase. You receive a unique key like WXYZ-2345-KLMN-PQRS.",
            },
            {
              n: "03",
              t: "Download instantly",
              d: "Enter your key on the download page and your file unlocks immediately.",
            },
          ].map((s, i) => (
            <div key={s.n} className={`card rise d${i + 1}`} style={{ padding: "26px 26px 30px" }}>
              <span className="display" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em" }}>
                {s.n}
              </span>
              <h3 className="display" style={{ fontSize: 19, fontWeight: 600, margin: "10px 0 8px" }}>
                {s.t}
              </h3>
              <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- catalog ---------- */}
      <section id="apps" style={{ scrollMarginTop: 90 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 10 }}>
          <h2 className="display" style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            Applications
          </h2>
          <span className="chip">{apps.length} available</span>
        </div>

        {apps.length === 0 ? (
          <div className="card" style={{ padding: "70px 30px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📦</div>
            <h3 className="display" style={{ fontSize: 21, fontWeight: 600, margin: "0 0 8px" }}>
              No applications yet
            </h3>
            <p className="muted" style={{ fontSize: 14.5, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              The catalog is empty right now. Check back soon — new software is added regularly.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 18,
            }}
          >
            {apps.map((app) => (
              <article key={app.id} className="card app-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <span className="app-icon" style={{ background: ICON_GRADIENTS[app.color] }} aria-hidden>
                    {app.icon}
                  </span>
                  <span className="chip mono">v{app.version}</span>
                </div>
                <div>
                  <h3 className="display" style={{ fontSize: 21, fontWeight: 650, margin: "0 0 6px" }}>
                    {app.name}
                  </h3>
                  <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0, minHeight: 48 }}>
                    {app.description.length > 150 ? app.description.slice(0, 150).trimEnd() + "…" : app.description}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--line)",
                    paddingTop: 16,
                    marginTop: "auto",
                  }}
                >
                  <div>
                    <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>
                      {formatPrice(app.price, settings.currency)}
                    </div>
                    <div className="faint" style={{ fontSize: 12.5 }}>
                      {formatBytes(app.fileSize)} · digital download
                    </div>
                  </div>
                  <a href="#buy" className="btn btn-primary btn-sm">
                    Get this app
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- how to buy ---------- */}
      <section id="buy" style={{ scrollMarginTop: 90, paddingTop: 80 }}>
        <div
          className="card"
          style={{
            padding: "44px 40px",
            textAlign: "center",
            background:
              "linear-gradient(160deg, rgba(109,92,255,0.10), rgba(56,217,245,0.05) 60%, transparent)",
          }}
        >
          <p className="section-label" style={{ marginBottom: 12 }}>
            How to buy
          </p>
          <h2 className="display" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>
            Get your license key
          </h2>
          <p
            className="muted"
            style={{
              fontSize: 15.5,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto",
              whiteSpace: "pre-line",
            }}
          >
            {settings.contactInfo}
          </p>
          {isPlaceholderContact(settings.contactInfo) ? null : (
            <div style={{ marginTop: 26 }}>
              <Link href="/download" className="btn btn-ghost">
                Already have a key? Download now →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
