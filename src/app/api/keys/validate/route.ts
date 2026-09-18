import { readDB, checkKey } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { key?: unknown };
  const db = readDB();
  const check = checkKey(db, String(body.key ?? ""));

  if (!check.ok) return Response.json({ ok: false, error: check.error });

  return Response.json({
    ok: true,
    app: {
      name: check.app.name,
      version: check.app.version,
      fileSize: check.app.fileSize,
      icon: check.app.icon,
      color: check.app.color,
    },
    downloadsLeft: check.record.maxDownloads - check.record.downloadCount,
    expiresAt: check.record.expiresAt,
  });
}
