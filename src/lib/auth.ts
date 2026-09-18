import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "av_admin";
const TTL_SECONDS = 7 * 24 * 3600; // 7 days

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export function isDefaultPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

function secret(): string {
  return process.env.ADMIN_SECRET || "appvault-dev-secret-change-me-in-production";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export async function createSession(): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `admin.${exp}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [who, expStr, sig] = parts;
  const expected = sign(`${who}.${expStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  if (who !== "admin") return false;
  return Number(expStr) > Date.now() / 1000;
}
