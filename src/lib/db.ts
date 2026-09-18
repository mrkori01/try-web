import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AppItem, DB, DownloadEvent, LicenseKey, Settings } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

export const DEFAULT_SETTINGS: Settings = {
  storeName: "AppVault",
  tagline: "Premium software, unlocked with a key.",
  currency: "₹",
  contactInfo:
    "To buy a license key, contact the seller. (Admins: edit this text in Dashboard → Settings to show your WhatsApp / email here.)",
};

let cache: DB | null = null;

export function uid(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function readDB(): DB {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
  } catch {
    cache = { apps: [], keys: [], events: [], settings: DEFAULT_SETTINGS };
  }
  cache!.apps ||= [];
  cache!.keys ||= [];
  cache!.events ||= [];
  cache!.settings = { ...DEFAULT_SETTINGS, ...(cache!.settings || {}) };
  return cache!;
}

// Serialize writes so concurrent requests can't corrupt the JSON file.
let writeQueue: Promise<unknown> = Promise.resolve();
export function writeDB(db: DB): Promise<void> {
  cache = db;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.promises.rename(tmp, DB_FILE);
  });
  return writeQueue as Promise<void>;
}

// ---- file storage helpers ----

export function uploadDirFor(appId: string): string {
  return path.join(UPLOAD_DIR, appId);
}

export function filePathFor(app: AppItem): string {
  return path.join(uploadDirFor(app.id), path.basename(app.fileName));
}

// ---- license key helpers ----

// No easily-confused characters (0/O, 1/I/L).
const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateKey(): string {
  const bytes = crypto.randomBytes(16);
  let raw = "";
  for (const b of bytes) raw += KEY_ALPHABET[b % KEY_ALPHABET.length];
  return raw.replace(/(.{4})(?=.)/g, "$1-");
}

export function normalizeKey(k: string): string {
  return k.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export type KeyCheck =
  | { ok: true; record: LicenseKey; app: AppItem }
  | { ok: false; error: string };

export function checkKey(db: DB, rawKey: string): KeyCheck {
  const norm = normalizeKey(rawKey);
  if (!norm) return { ok: false, error: "Please enter your license key." };
  const record = db.keys.find((k) => normalizeKey(k.key) === norm);
  if (!record)
    return {
      ok: false,
      error: "This key is not valid. Please check it for typos and try again.",
    };
  const app = db.apps.find((a) => a.id === record.appId);
  if (!app)
    return { ok: false, error: "The application for this key no longer exists. Contact the seller." };
  if (record.revoked)
    return { ok: false, error: "This key has been revoked. Contact the seller." };
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now())
    return { ok: false, error: "This key has expired. Contact the seller to renew it." };
  if (record.downloadCount >= record.maxDownloads)
    return {
      ok: false,
      error: `This key has reached its download limit (${record.maxDownloads} download${record.maxDownloads === 1 ? "" : "s"}).`,
    };
  return { ok: true, record, app };
}

export function logEvent(db: DB, e: Omit<DownloadEvent, "id" | "at">) {
  db.events.push({ id: uid(), at: new Date().toISOString(), ...e });
}
