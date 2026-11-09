import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, pointsLedger, reviews, wishlistItems } from "@/db/schema";
import { getCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// Data export on request (Kenya Data Protection Act, 2019; PRD NF-7).
export async function GET() {
  const c = await getCustomer();
  if (!c) return new Response("Sign in first", { status: 401 });
  const myOrders = await db.select().from(orders).where(eq(orders.customerId, c.id)).orderBy(desc(orders.createdAt));
  const items = await Promise.all(myOrders.map((o) => db.select().from(orderItems).where(eq(orderItems.orderId, o.id))));
  const data = {
    exportedAt: new Date().toISOString(),
    profile: { phone: c.phone, name: c.name, email: c.email, tier: c.tier, joinedAt: c.joinedAt, marketingConsent: c.marketingConsent },
    orders: myOrders.map((o, i) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt,
      status: o.status,
      total: o.total,
      address: o.address,
      zone: o.zoneName,
      items: items[i].map((x) => ({ name: x.name, model: x.modelNumber, qty: x.qty, unitPrice: x.unitPrice })),
    })),
    points: await db.select({ type: pointsLedger.type, points: pointsLedger.points, status: pointsLedger.status, reason: pointsLedger.reason, date: pointsLedger.createdAt }).from(pointsLedger).where(eq(pointsLedger.customerId, c.id)),
    reviews: await db.select({ productId: reviews.productId, rating: reviews.rating, body: reviews.body, date: reviews.createdAt }).from(reviews).where(eq(reviews.customerId, c.id)),
    wishlist: (await db.select({ productId: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.customerId, c.id))).map((w) => w.productId),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="my-data.json"' },
  });
}
