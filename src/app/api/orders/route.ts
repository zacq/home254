import { getCustomer } from "@/lib/customer-auth";
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
  const lines = Array.isArray(b.lines) ? b.lines.slice(0, 50) : [];
  const str = (k: string, max = 500) => (typeof b[k] === "string" ? (b[k] as string).slice(0, max) : undefined);
  const res = await createOrder(
    {
      name: str("name", 120) ?? "",
      phone: str("phone", 30) ?? "",
      email: str("email", 200),
      zoneId: Number(b.zoneId) || null,
      address: str("address", 500) ?? "",
      deliveryDate: str("deliveryDate", 20),
      deliverySlot: str("deliverySlot", 40),
      installIds: Array.isArray(b.installIds) ? b.installIds.map(Number).filter(Number.isInteger) : [],
      promoCode: str("promoCode", 40),
      usePoints: b.usePoints === true,
      notes: str("notes", 1000),
      paymentMethod: b.paymentMethod === "pod" ? "pod" : "mpesa",
      marketingConsent: b.marketingConsent === true,
      source: "website",
      lines: lines.map((l: Record<string, unknown>) => ({
        productId: Number(l.productId),
        qty: Number(l.qty) || 1,
        extendedWarranty: l.extendedWarranty === true,
        pedestal: l.pedestal === true,
      })),
    },
    await getCustomer(),
  );
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
