import { requestCode } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website) return Response.json({ ok: true });
  const res = await requestCode(typeof b.phone === "string" ? b.phone.slice(0, 30) : "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
