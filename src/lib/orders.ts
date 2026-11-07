import crypto from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, notifications, orderItems, orders, products } from "@/db/schema";
import { activePrice, ksh, normalisePhone } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { zones as getZones } from "@/lib/queries";

export const ORDER_STATUSES = [
  { key: "new", label: "New" },
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "confirmed", label: "Paid / Confirmed" },
  { key: "scheduled", label: "Scheduled for delivery" },
  { key: "delivered", label: "Delivered & installed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
] as const;

export const statusLabel = (k: string) => ORDER_STATUSES.find((s) => s.key === k)?.label ?? k;

export type OrderInput = {
  name: string;
  phone: string;
  email?: string;
  zoneId: number;
  address: string;
  deliveryDate?: string;
  installation: boolean;
  notes?: string;
  paymentMethod: "mpesa" | "pod";
  source?: string;
  lines: { productId: number; qty: number; extendedWarranty?: boolean; pedestal?: boolean }[];
};

export type OrderResult =
  | { ok: true; orderNumber: string; token: string; total: number }
  | { ok: false; error: string };

export async function logAudit(actor: string, action: string, entity: string, entityId?: string | number, detail?: string) {
  await db.insert(auditLogs).values({ actor, action, entity, entityId: entityId != null ? String(entityId) : null, detail });
}

export function customerMessage(status: string, o: { orderNumber: string; customerName: string; paymentMethod: string; total: number; deliveryDate?: string | null }, till?: string) {
  const hi = `Hi ${o.customerName.split(" ")[0]},`;
  switch (status) {
    case "new":
      return `${hi} we've received your order ${o.orderNumber} (${ksh(o.total)}). ${
        o.paymentMethod === "mpesa"
          ? `Pay via M-Pesa Till ${till} using ${o.orderNumber} as the reference, then send us the M-Pesa code.`
          : "Our sales team will call you shortly to confirm. You pay on delivery via M-Pesa."
      }`;
    case "awaiting_payment":
      return `${hi} a friendly reminder: order ${o.orderNumber} is awaiting payment. M-Pesa Till ${till}, reference ${o.orderNumber}. Reply here if you need help.`;
    case "confirmed":
      return `${hi} order ${o.orderNumber} is confirmed. We'll message you the delivery window shortly. Thank you!`;
    case "scheduled":
      return `${hi} order ${o.orderNumber} is scheduled for delivery${o.deliveryDate ? ` on ${o.deliveryDate}` : ""}. Our driver will call before arriving.`;
    case "delivered":
      return `${hi} your order ${o.orderNumber} has been delivered and installed. Thank you for shopping with us — we'd love a review with a photo of your machine!`;
    case "cancelled":
      return `${hi} order ${o.orderNumber} has been cancelled. Message us if this is a mistake.`;
    case "refunded":
      return `${hi} order ${o.orderNumber} has been refunded. Please allow a few days for M-Pesa to reflect it.`;
    default:
      return `${hi} update on order ${o.orderNumber}: ${statusLabel(status)}.`;
  }
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const phone = normalisePhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid Kenyan phone number (07xx or 01xx)." };
  if (!input.name.trim() || !input.address.trim()) return { ok: false, error: "Name and delivery address are required." };
  if (!input.lines.length) return { ok: false, error: "Your cart is empty." };

  const s = await getSettings();
  const zone = (await getZones(false)).find((z) => z.id === input.zoneId);
  if (!zone) return { ok: false, error: "Choose a delivery area." };

  const ids = input.lines.map((l) => l.productId);
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));

  let subtotal = 0;
  let addons = 0;
  const items: (typeof orderItems.$inferInsert)[] = [];
  for (const l of input.lines) {
    const p = byId.get(l.productId);
    const qty = Math.max(1, Math.min(10, Math.floor(l.qty)));
    if (!p || p.archived) return { ok: false, error: "A product in your cart is no longer available." };
    if (p.stockQty < qty) return { ok: false, error: `${p.name} has only ${p.stockQty} in stock.` };
    const price = activePrice(p).price;
    const wPrice = l.extendedWarranty ? Math.round((price * Number(s.warrantyPct)) / 100 / 100) * 100 : 0;
    const pPrice = l.pedestal ? Number(s.pedestalPrice) || 0 : 0;
    subtotal += price * qty;
    addons += (wPrice + pPrice) * qty;
    items.push({
      orderId: 0,
      productId: p.id,
      name: p.name,
      modelNumber: p.modelNumber,
      unitPrice: price,
      qty,
      extendedWarranty: !!l.extendedWarranty,
      warrantyPrice: wPrice,
      pedestal: pPrice > 0,
      pedestalPrice: pPrice,
    });
  }
  const installFee = input.installation ? zone.installFee : 0;
  const total = subtotal + addons + zone.fee + installFee;

  if (input.paymentMethod === "pod") {
    if (!zone.podAllowed) return { ok: false, error: "Pay on Delivery is not available for this area. Please choose M-Pesa." };
    if (total > Number(s.podCap)) return { ok: false, error: `Pay on Delivery is only available for orders up to ${ksh(Number(s.podCap))}.` };
  }
  const deposit = total >= Number(s.depositThreshold) ? Math.ceil((total * Number(s.depositPct)) / 100 / 100) * 100 : 0;

  const year = new Date().getFullYear();
  const token = crypto.randomBytes(16).toString("hex");

  const created = await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(orders);
    const orderNumber = `ORD-${year}-${String(n + 101).padStart(5, "0")}`;
    const [o] = await tx
      .insert(orders)
      .values({
        orderNumber,
        token,
        customerName: input.name.trim(),
        phone,
        email: input.email?.trim() || null,
        zoneId: zone.id,
        zoneName: zone.name,
        address: input.address.trim(),
        deliveryDate: input.deliveryDate || null,
        installation: input.installation,
        notes: input.notes?.trim() || null,
        paymentMethod: input.paymentMethod,
        status: input.paymentMethod === "mpesa" ? "awaiting_payment" : "new",
        subtotal,
        addonsTotal: addons,
        deliveryFee: zone.fee,
        installFee,
        total,
        depositRequired: deposit,
        source: input.source || "website",
      })
      .returning();
    await tx.insert(orderItems).values(items.map((i) => ({ ...i, orderId: o.id })));
    for (const i of items) {
      await tx
        .update(products)
        .set({ stockQty: sql`greatest(${products.stockQty} - ${i.qty}, 0)`, popularity: sql`${products.popularity} + 1` })
        .where(eq(products.id, i.productId!));
    }
    await tx.insert(notifications).values([
      {
        audience: "customer",
        recipient: phone,
        subject: `Order received ${orderNumber}`,
        message: customerMessage("new", { orderNumber, customerName: o.customerName, paymentMethod: o.paymentMethod, total }, s.tillNumber),
        refType: "order",
        refId: o.id,
      },
      {
        audience: "admin",
        recipient: s.whatsapp,
        subject: `New order ${orderNumber}`,
        message: `New ${input.source || "website"} order ${orderNumber} from ${o.customerName} (${phone}) — ${ksh(total)} · ${input.paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"} · ${zone.name}`,
        refType: "order",
        refId: o.id,
      },
    ]);
    return o;
  });

  return { ok: true, orderNumber: created.orderNumber, token: created.token, total };
}
