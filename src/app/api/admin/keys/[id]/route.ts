import { isAdmin } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = readDB();
  const record = db.keys.find((k) => k.id === id);
  if (!record) return Response.json({ error: "Key not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.revoked === "boolean") record.revoked = body.revoked;
  if (body.maxDownloads !== undefined) {
    const n = Math.min(1000, Math.max(1, Number(body.maxDownloads)));
    if (!isNaN(n)) record.maxDownloads = n;
  }
  if (body.resetDownloads === true) record.downloadCount = 0;

  await writeDB(db);
  return Response.json({ ok: true, key: record });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = readDB();
  const idx = db.keys.findIndex((k) => k.id === id);
  if (idx === -1) return Response.json({ error: "Key not found" }, { status: 404 });

  db.keys.splice(idx, 1);
  await writeDB(db);
  return Response.json({ ok: true });
}
