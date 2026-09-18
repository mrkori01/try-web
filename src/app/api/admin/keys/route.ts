import { isAdmin } from "@/lib/auth";
import { readDB, writeDB, uid, generateKey, normalizeKey } from "@/lib/db";
import type { LicenseKey } from "@/types";

export const runtime = "nodejs";

function toExpiryISO(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  // date input gives YYYY-MM-DD → expire at end of that day (UTC)
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const appId = String(body.appId ?? "");
  const customerName = String(body.customerName ?? "").trim().slice(0, 120);
  const customerEmail = String(body.customerEmail ?? "").trim().slice(0, 200);
  const maxDownloads = Math.min(1000, Math.max(1, Number(body.maxDownloads) || 3));
  const expiresAt = toExpiryISO(body.expiresAt);

  const db = readDB();
  if (!db.apps.some((a) => a.id === appId))
    return Response.json({ error: "Please choose a valid application" }, { status: 400 });

  // Generate a collision-free key.
  let key = generateKey();
  for (let i = 0; i < 50 && db.keys.some((k) => normalizeKey(k.key) === normalizeKey(key)); i++) {
    key = generateKey();
  }

  const record: LicenseKey = {
    id: uid(),
    key,
    appId,
    customerName,
    customerEmail,
    maxDownloads,
    downloadCount: 0,
    expiresAt,
    revoked: false,
    createdAt: new Date().toISOString(),
  };
  db.keys.push(record);
  await writeDB(db);

  return Response.json({ ok: true, key: record });
}
