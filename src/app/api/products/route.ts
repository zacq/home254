import { activePrice } from "@/lib/format";
import { productsByIds } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Lets the cart refresh prices and stock saved on the device.
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);
  const rows = await productsByIds(ids);
  return Response.json({ products: rows.map((p) => ({ id: p.id, price: activePrice(p).price, stock: p.stockQty })) });
}
