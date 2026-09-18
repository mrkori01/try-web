import fs from "fs";
import path from "path";
import { isAdmin } from "@/lib/auth";
import { readDB, writeDB, uid, uploadDirFor } from "@/lib/db";
import type { AppItem, GradientKey } from "@/types";

export const runtime = "nodejs";

export const COLORS: GradientKey[] = ["violet", "cyan", "emerald", "amber", "rose", "sky"];

export function sanitizeFileName(name: string): string {
  return (
    path
      .basename(name || "app.bin")
      .replace(/[^\w.\-() ]+/g, "_")
      .slice(0, 120) || "app.bin"
  );
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const version = String(fd.get("version") ?? "1.0.0").trim() || "1.0.0";
  const price = Math.max(0, Number(fd.get("price")) || 0);
  const icon = (String(fd.get("icon") ?? "📦").trim() || "📦").slice(0, 4);
  const colorRaw = String(fd.get("color") ?? "violet") as GradientKey;
  const color = COLORS.includes(colorRaw) ? colorRaw : "violet";
  const file = fd.get("file");

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0)
    return Response.json({ error: "Please attach the application file" }, { status: 400 });

  const id = uid();
  const safeName = sanitizeFileName(file.name);
  const dir = uploadDirFor(id);
  await fs.promises.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(path.join(dir, safeName), buf);

  const db = readDB();
  const app: AppItem = {
    id,
    name,
    description,
    version,
    price,
    icon,
    color,
    fileName: safeName,
    fileSize: buf.length,
    createdAt: new Date().toISOString(),
  };
  db.apps.push(app);
  await writeDB(db);

  return Response.json({ ok: true, app });
}
