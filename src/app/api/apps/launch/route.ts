import { readDB, writeDB, checkKey, logEvent, normalizeKey } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Launch an application with a license key.
 * Counts one "access" against the key and returns where to go:
 * - webapp → the on-site app URL served at /app/<key>/
 * - link   → the hidden external URL the admin set
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { key?: unknown };
  const rawKey = String(body.key ?? "");
  const db = readDB();
  const check = checkKey(db, rawKey);
  if (!check.ok) return Response.json({ ok: false, error: check.error });

  const record = db.keys.find((k) => k.id === check.record.id);
  if (record) {
    record.downloadCount += 1;
    logEvent(db, { keyId: record.id, appId: check.app.id });
    await writeDB(db);
  }

  const url =
    check.app.delivery === "link"
      ? (check.app.linkUrl as string)
      : `/app/${encodeURIComponent(normalizeKey(rawKey))}/`;

  return Response.json({
    ok: true,
    type: check.app.delivery,
    url,
    accessesLeft: record ? record.maxDownloads - record.downloadCount : null,
  });
}
