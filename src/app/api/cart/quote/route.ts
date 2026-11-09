import { getCustomer } from "@/lib/customer-auth";
import { quote } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Live prices, points, delivery and totals for the cart and checkout, from the same code that places the order.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 50).map((l: Record<string, unknown>) => ({
    productId: Number(l.productId),
    qty: Number(l.qty) || 1,
    extendedWarranty: l.extendedWarranty === true,
    pedestal: l.pedestal === true,
  }));
  const q = await quote(
    {
      lines,
      zoneId: Number(b.zoneId) || null,
      installIds: Array.isArray(b.installIds) ? b.installIds.map(Number).filter(Number.isInteger) : [],
      promoCode: typeof b.promoCode === "string" ? b.promoCode.slice(0, 40) : undefined,
      usePoints: b.usePoints === true,
      phone: typeof b.phone === "string" ? b.phone.slice(0, 30) : undefined,
    },
    await getCustomer(),
  );
  return Response.json(q);
}
