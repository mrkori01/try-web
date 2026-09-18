import { adminPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || body.password !== adminPassword()) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }
  await createSession();
  return Response.json({ ok: true });
}
