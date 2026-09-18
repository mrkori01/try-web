import fs from "fs";
import path from "path";
import { isAdmin } from "@/lib/auth";
import { readDB, writeDB, uploadDirFor, filePathFor } from "@/lib/db";
import type { GradientKey } from "@/types";
import { COLORS, sanitizeFileName } from "../route";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const db = readDB();
  const app = db.apps.find((a) => a.id === id);
  if (!app) return Response.json({ error: "Application not found" }, { status: 404 });

  const name = String(fd.get("name") ?? "").trim();
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  app.name = name;
  app.description = String(fd.get("description") ?? "").trim();
  app.version = String(fd.get("version") ?? "1.0.0").trim() || "1.0.0";
  app.price = Math.max(0, Number(fd.get("price")) || 0);
  app.icon = (String(fd.get("icon") ?? "📦").trim() || "📦").slice(0, 4);
  const colorRaw = String(fd.get("color") ?? "violet") as GradientKey;
  app.color = COLORS.includes(colorRaw) ? colorRaw : "violet";

  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    const oldPath = filePathFor(app);
    const safeName = sanitizeFileName(file.name);
    const dir = uploadDirFor(app.id);
    await fs.promises.mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(path.join(dir, safeName), buf);
    if (oldPath !== path.join(dir, safeName)) {
      await fs.promises.rm(oldPath, { force: true }).catch(() => {});
    }
    app.fileName = safeName;
    app.fileSize = buf.length;
  }

  await writeDB(db);
  return Response.json({ ok: true, app });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = readDB();
  const idx = db.apps.findIndex((a) => a.id === id);
  if (idx === -1) return Response.json({ error: "Application not found" }, { status: 404 });

  db.apps.splice(idx, 1);
  // Cascade: remove keys for this app so they can't be used or leak info.
  db.keys = db.keys.filter((k) => k.appId !== id);
  await writeDB(db);

  await fs.promises.rm(uploadDirFor(id), { recursive: true, force: true }).catch(() => {});
  return Response.json({ ok: true });
}
