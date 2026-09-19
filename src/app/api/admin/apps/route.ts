import fs from "fs";
import path from "path";
import { isAdmin } from "@/lib/auth";
import { readDB, writeDB, uid, uploadDirFor } from "@/lib/db";
import { extractZipToEntries } from "@/lib/webapp";
import type { AppItem, DeliveryType, GradientKey } from "@/types";

export const runtime = "nodejs";

export const COLORS: GradientKey[] = ["violet", "cyan", "emerald", "amber", "rose", "sky"];

export function sanitizeFileName(name: string): string {
  return (
    path
      .basename(name || "app")
      .replace(/[^\w.\-() ]+/g, "_")
      .slice(0, 120) || "app"
  );
}

export function isValidLink(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Writes an uploaded web app (.zip bundle or single .html file) into the
 * app's upload directory, returning display info. Throws with a
 * user-friendly message on invalid uploads.
 */
export async function writeWebAppFiles(
  dir: string,
  file: File
): Promise<{ displayName: string; size: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const rawName = sanitizeFileName(file.name || "webapp");
  const ext = path.extname(rawName).toLowerCase();

  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });

  if (ext === ".zip") {
    const entries = extractZipToEntries(buf);
    for (const { rel, data } of entries) {
      const dest = path.join(dir, rel);
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.writeFile(dest, data);
    }
  } else if (ext === ".html" || ext === ".htm") {
    await fs.promises.writeFile(path.join(dir, "index.html"), buf);
  } else {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
    throw new Error("Upload a .zip (web app with index.html) or a single .html file.");
  }

  return { displayName: rawName, size: buf.length };
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
  const delivery: DeliveryType = fd.get("delivery") === "link" ? "link" : "webapp";
  const linkUrl = String(fd.get("linkUrl") ?? "").trim();
  const file = fd.get("file");

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const id = uid();
  let fileName = "";
  let fileSize = 0;

  if (delivery === "link") {
    if (!isValidLink(linkUrl))
      return Response.json(
        { error: "Enter a valid link for this app (https://…)" },
        { status: 400 }
      );
  } else {
    if (!(file instanceof File) || file.size === 0)
      return Response.json(
        { error: "Attach the web app — a .zip bundle or a single .html file." },
        { status: 400 }
      );
    try {
      const written = await writeWebAppFiles(uploadDirFor(id), file);
      fileName = written.displayName;
      fileSize = written.size;
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const db = readDB();
  const app: AppItem = {
    id,
    name,
    description,
    version,
    price,
    icon,
    color,
    delivery,
    linkUrl: delivery === "link" ? linkUrl : undefined,
    fileName,
    fileSize,
    createdAt: new Date().toISOString(),
  };
  db.apps.push(app);
  await writeDB(db);

  return Response.json({ ok: true, app });
}
