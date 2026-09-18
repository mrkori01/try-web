import fs from "fs";
import { Readable } from "stream";
import { readDB, writeDB, checkKey, filePathFor, logEvent } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const db = readDB();
  const check = checkKey(db, key);

  if (!check.ok) {
    return new Response(`Download not allowed: ${check.error}`, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const filePath = filePathFor(check.app);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return new Response("The file is missing on the server. Please contact the seller.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Count this download, then stream the file.
  const record = db.keys.find((k) => k.id === check.record.id);
  if (record) {
    record.downloadCount += 1;
    logEvent(db, { keyId: record.id, appId: check.app.id });
    await writeDB(db);
  }

  const filename = check.app.fileName.replace(/"/g, "");
  const stream = fs.createReadStream(filePath);

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(stat.size),
      "Cache-Control": "no-store",
    },
  });
}
