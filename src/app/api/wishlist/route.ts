import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// Signed-in members keep their wishlist on the account; guests keep it on the device only.
export async function GET() {
  const c = await getCustomer();
  if (!c) return Response.json({ ids: [] });
  const rows = await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.customerId, c.id));
  return Response.json({ ids: rows.map((r) => r.id) });
}

export async function POST(req: Request) {
  const c = await getCustomer();
  if (!c) return Response.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { add?: unknown; remove?: unknown };
  const ids = (v: unknown) => (Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100) : []);
  const add = ids(b.add);
  const remove = ids(b.remove);
  if (add.length) {
    const real = await db.select({ id: products.id }).from(products).where(inArray(products.id, add));
    if (real.length) await db.insert(wishlistItems).values(real.map((r) => ({ customerId: c.id, productId: r.id }))).onConflictDoNothing();
  }
  if (remove.length) await db.delete(wishlistItems).where(and(eq(wishlistItems.customerId, c.id), inArray(wishlistItems.productId, remove)));
  return Response.json({ ok: true });
}
