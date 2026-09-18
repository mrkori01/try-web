import { isAdmin } from "@/lib/auth";
import { readDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = readDB();
  return Response.json({
    apps: db.apps,
    keys: db.keys,
    settings: db.settings,
    totalDownloads: db.events.length,
  });
}
