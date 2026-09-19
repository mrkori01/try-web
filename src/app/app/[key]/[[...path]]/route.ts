import fs from "fs";
import path from "path";
import { readDB, checkKey, uploadDirFor } from "@/lib/db";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  webmanifest: "application/manifest+json",
  wasm: "application/wasm",
  zip: "application/zip",
};

function mimeFor(file: string): string {
  const ext = path.posix.extname(file).slice(1).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

/** Injects <base href> into served HTML so relative asset URLs work. */
function injectBase(html: string, baseHref: string): string {
  if (/<base[\s>]/i.test(html)) return html; // respect an existing base tag
  const tag = `<base href="${baseHref}">`;
  const head = html.match(/<head[^>]*>/i);
  if (head) return html.replace(head[0], head[0] + tag);
  return tag + html;
}

function deny(error: string): Response {
  return new Response(`Access denied: ${error}`, {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string; path?: string[] }> }
) {
  const { key, path: segs = [] } = await params;
  const db = readDB();
  const check = checkKey(db, key);
  if (!check.ok) return deny(check.error);

  const app = check.app;
  if (app.delivery === "link")
    return deny("This application is unlocked via its link, not on this website.");

  const root = uploadDirFor(app.id);
  const rel = segs.join("/");

  // Path-traversal guard: the resolved target must stay inside the app folder.
  let target = path.resolve(root, rel);
  if (target !== root && !target.startsWith(root + path.sep))
    return new Response("Not found", { status: 404 });

  let stat = fs.statSync(target, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    target = path.join(target, "index.html");
    stat = fs.statSync(target, { throwIfNoEntry: false });
  }

  // SPA fallback: extension-less unknown paths serve the root index.html.
  if ((!stat || !stat.isFile()) && !path.posix.basename(rel).includes(".")) {
    target = path.join(root, "index.html");
    stat = fs.statSync(target, { throwIfNoEntry: false });
  }

  if (!stat || !stat.isFile()) return new Response("Not found", { status: 404 });

  const relToRoot = path.relative(root, target).split(path.sep).join("/");
  const ext = path.posix.extname(target).slice(1).toLowerCase();
  const raw = await fs.promises.readFile(target);

  let body: BodyInit = new Uint8Array(raw);
  const headers: Record<string, string> = { "Content-Type": mimeFor(target) };

  if (ext === "html" || ext === "htm") {
    const dir = path.posix.dirname(relToRoot);
    const base = `/app/${encodeURIComponent(key)}/${dir === "." ? "" : dir + "/"}`;
    body = injectBase(raw.toString("utf8"), base);
    headers["Cache-Control"] = "no-store";
  } else {
    headers["Cache-Control"] = "public, max-age=300";
  }

  return new Response(body, { headers });
}
