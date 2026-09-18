import { isAdmin } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const db = readDB();

  if (typeof body.storeName === "string" && body.storeName.trim())
    db.settings.storeName = body.storeName.trim().slice(0, 60);
  if (typeof body.tagline === "string") db.settings.tagline = body.tagline.trim().slice(0, 140);
  if (typeof body.currency === "string" && body.currency.trim())
    db.settings.currency = body.currency.trim().slice(0, 4);
  if (typeof body.contactInfo === "string")
    db.settings.contactInfo = body.contactInfo.trim().slice(0, 600);

  await writeDB(db);
  return Response.json({ ok: true, settings: db.settings });
}
