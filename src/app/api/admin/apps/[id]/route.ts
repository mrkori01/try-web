import fs from "fs";
import { isAdmin } from "@/lib/auth";
import { readDB, writeDB, uploadDirFor } from "@/lib/db";
import type { DeliveryType, GradientKey } from "@/types";
import { COLORS, isValidLink, writeWebAppFiles } from "../route";

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

  const delivery: DeliveryType = fd.get("delivery") === "link" ? "link" : "webapp";
  const linkUrl = String(fd.get("linkUrl") ?? "").trim();
  const file = fd.get("file");

  if (delivery === "link") {
    const newUrl = linkUrl || app.linkUrl || "";
    if (app.delivery !== "link" && !linkUrl)
      return Response.json(
        { error: "Enter the hidden link for this app (https://…)" },
        { status: 400 }
      );
    if (!isValidLink(newUrl))
      return Response.json(
        { error: "Enter a valid link for this app (https://…)" },
        { status: 400 }
      );
    app.delivery = "link";
    app.linkUrl = newUrl;
    // Web files are no longer needed.
    app.fileName = "";
    app.fileSize = 0;
    await fs.promises.rm(uploadDirFor(app.id), { recursive: true, force: true }).catch(() => {});
  } else {
    app.delivery = "webapp";
    app.linkUrl = undefined;
    if (file instanceof File && file.size > 0) {
      try {
        const written = await writeWebAppFiles(uploadDirFor(app.id), file);
        app.fileName = written.displayName;
        app.fileSize = written.size;
      } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 400 });
      }
    } else if (!app.fileName) {
      return Response.json(
        { error: "Attach the web app — a .zip bundle or a single .html file." },
        { status: 400 }
      );
    }
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
