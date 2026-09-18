import type { GradientKey } from "@/types";

export const ICON_GRADIENTS: Record<GradientKey, string> = {
  violet: "linear-gradient(135deg,#6d5cff,#b06cff)",
  cyan: "linear-gradient(135deg,#06b6d4,#3b82f6)",
  emerald: "linear-gradient(135deg,#10b981,#34d399)",
  amber: "linear-gradient(135deg,#f59e0b,#f97316)",
  rose: "linear-gradient(135deg,#f43f5e,#ec4899)",
  sky: "linear-gradient(135deg,#0ea5e9,#6366f1)",
};

export const GRADIENT_LABELS: Record<GradientKey, string> = {
  violet: "Violet",
  cyan: "Cyan",
  emerald: "Emerald",
  amber: "Amber",
  rose: "Rose",
  sky: "Sky",
};

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log2(n) / 10));
  const v = n / Math.pow(1024, i);
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

// Deterministic (UTC) so server and client renders always match.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export function formatPrice(price: number, currency: string): string {
  if (price <= 0) return "Free";
  return `${currency}${price.toLocaleString("en-IN")}`;
}

// Formats raw input as XXXX-XXXX-XXXX-XXXX while typing.
export function formatKeyInput(v: string): string {
  const raw = v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
  return raw.replace(/(.{4})(?=.)/g, "$1-");
}

export function isPlaceholderContact(contact: string): boolean {
  return contact.includes("Admins: edit this text");
}
