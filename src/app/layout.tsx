import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = readDB();
  return {
    title: {
      default: `${settings.storeName} — ${settings.tagline}`,
      template: `%s · ${settings.storeName}`,
    },
    description: settings.tagline,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = readDB();
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
        <div className="scene" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="gridlines" />
        </div>

        <header className="nav">
          <div className="wrap nav-inner">
            <Link href="/" className="logo">
              <span className="logo-mark" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="8" cy="12" r="3.4" />
                  <path d="M11.4 12H21" />
                  <path d="M17.5 12v3.2" />
                  <path d="M21 12v2.4" />
                </svg>
              </span>
              <span className="display">{settings.storeName}</span>
            </Link>
            <nav className="nav-links">
              <Link className="nav-link" href="/">
                Apps
              </Link>
              <Link className="nav-link" href="/access">
                Access app
              </Link>
              <Link className="nav-link" href="/admin">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer style={{ borderTop: "1px solid var(--line)", marginTop: 90 }}>
          <div
            className="wrap"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 26,
              paddingBottom: 30,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span className="muted" style={{ fontSize: 13.5 }}>
              © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
            </span>
            <span className="faint" style={{ fontSize: 13 }}>
              Secure key-based app access
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
