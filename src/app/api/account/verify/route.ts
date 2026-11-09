import { verifyCode } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const res = await verifyCode(s("phone").slice(0, 30), s("code").trim(), { name: s("name"), email: s("email"), consent: b.consent === true });
  if (!res.ok) return Response.json(res, { status: 400 });
  return Response.json({ ok: true, joined: res.joined, bonus: res.bonus });
}
