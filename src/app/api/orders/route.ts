import { createOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (typeof b.website === "string" && b.website) return Response.json({ ok: false, error: "Rejected" }, { status: 400 });
  if (b.terms !== true) return Response.json({ ok: false, error: "Please accept the terms of sale." }, { status: 400 });
  const lines = Array.isArray(b.lines) ? b.lines : [];
  const res = await createOrder({
    name: String(b.name ?? ""),
    phone: String(b.phone ?? ""),
    email: b.email ? String(b.email) : undefined,
    zoneId: Number(b.zoneId),
    address: String(b.address ?? ""),
    deliveryDate: b.deliveryDate ? String(b.deliveryDate) : undefined,
    installation: b.installation === true,
    notes: b.notes ? String(b.notes).slice(0, 1000) : undefined,
    paymentMethod: b.paymentMethod === "pod" ? "pod" : "mpesa",
    source: "website",
    lines: lines.map((l: Record<string, unknown>) => ({
      productId: Number(l.productId),
      qty: Number(l.qty) || 1,
      extendedWarranty: l.extendedWarranty === true,
      pedestal: l.pedestal === true,
    })),
  });
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
