import crypto from "node:crypto";
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, customers, orderItems, orders, pointsLedger, products, promoCodes, type Customer, type Order } from "@/db/schema";
import { activePrice, ksh, normalisePhone, priceInfo, productImage, productPath } from "@/lib/format";
import { queueMessage } from "@/lib/messages";
import { addOnProducts, getInstallServices, isAddOnFor, zones as getZones } from "@/lib/queries";
import {
  activeCampaigns,
  addPoints,
  balances,
  campaignMultiplier,
  earnPoints,
  expireIfDue,
  getRewardsConfig,
  isTier,
  nextTier,
  refreshTier,
  spend12m,
  TIER_LABEL,
  TIER_NUDGE,
  type Tier,
} from "@/lib/rewards";
import { getSettings } from "@/lib/settings";

export const ORDER_STATUSES = [
  { key: "new", label: "Received" },
  { key: "awaiting_payment", label: "Awaiting payment" },
  { key: "confirmed", label: "Paid / Confirmed" },
  { key: "scheduled", label: "Delivery booked" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered & installed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
] as const;
export const PAID_STATUSES = ["confirmed", "scheduled", "dispatched", "delivered"];
export const DELIVERY_SLOTS = ["Morning (8–12)", "Afternoon (12–4)", "Evening (4–7)"];

export const statusLabel = (k: string) => ORDER_STATUSES.find((s) => s.key === k)?.label ?? k;
const isDead = (status: string) => status === "cancelled" || status === "refunded";

export type CartLine = { productId: number; qty: number; extendedWarranty?: boolean; pedestal?: boolean };
export type QuoteInput = { lines: CartLine[]; zoneId?: number | null; installIds?: number[]; promoCode?: string; usePoints?: boolean; phone?: string };

export type QuoteLine = {
  productId: number;
  name: string;
  modelNumber: string;
  path: string;
  image: string;
  category: string;
  price: number;
  was: number | null;
  qty: number;
  stock: number;
  onOffer: boolean;
  warrantyPrice: number;
  pedestalPrice: number;
  points: number;
  bonus: number;
  laundry: boolean;
};

export async function logAudit(actor: string, action: string, entity: string, entityId?: string | number, detail?: string) {
  await db.insert(auditLogs).values({ actor, action, entity, entityId: entityId != null ? String(entityId) : null, detail });
}

export async function quote(input: QuoteInput, customer: Customer | null) {
  const [s, cfg, campaigns, zoneList, services] = await Promise.all([getSettings(), getRewardsConfig(), activeCampaigns(), getZones(false), getInstallServices()]);
  const ids = [...new Set(input.lines.map((l) => l.productId).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50);
  const rows = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(rows.map((p) => [p.id, p]));
  const tier: Tier = customer && isTier(customer.tier) ? customer.tier : "bronze";
  const rate = cfg.rate[tier];
  const errors: string[] = [];

  const lines: QuoteLine[] = [];
  for (const l of input.lines) {
    const p = byId.get(l.productId);
    if (!p || p.archived) {
      errors.push("A product in your cart is no longer available.");
      continue;
    }
    const pi = priceInfo(p);
    const qty = Math.max(1, Math.min(10, Math.floor(l.qty) || 1));
    if (p.stockQty < qty) errors.push(p.stockQty > 0 ? `${p.name} has only ${p.stockQty} in stock.` : `${p.name} is out of stock.`);
    const laundry = p.category === "washers" && !!(p.washCapacityKg || p.dryCapacityKg);
    const warrantyPrice = l.extendedWarranty ? Math.round((pi.price * Number(s.warrantyPct)) / 100 / 100) * 100 : 0;
    const pedestalPrice = l.pedestal && laundry ? Number(s.pedestalPrice) || 0 : 0;
    lines.push({
      productId: p.id,
      name: p.name,
      modelNumber: p.modelNumber,
      path: productPath(p),
      image: productImage(p),
      category: p.category,
      price: pi.price,
      was: pi.was,
      qty,
      stock: p.stockQty,
      onOffer: pi.onOffer,
      warrantyPrice,
      pedestalPrice,
      points: earnPoints(pi.price * qty, rate, campaignMultiplier(p, campaigns)),
      bonus: 0,
      laundry,
    });
  }

  // Cross-sell bonus on a matched add-on bought with its main item (RW-11).
  for (const line of lines) {
    const p = byId.get(line.productId)!;
    const mains = lines.filter((o) => o.productId !== line.productId).map((o) => o.category);
    if (cfg.crossSellBonus > 0 && isAddOnFor(p, mains)) line.bonus = cfg.crossSellBonus;
  }

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const savings = lines.reduce((n, l) => n + (l.was ? (l.was - l.price) * l.qty : 0), 0);
  const addons = lines.reduce((n, l) => n + (l.warrantyPrice + l.pedestalPrice) * l.qty, 0);
  const cats = [...new Set(lines.map((l) => l.category))];

  const zone = zoneList.find((z) => z.id === input.zoneId && z.active) ?? null;
  let delivery = zone?.fee ?? 0;
  let deliveryNote = "";
  if (zone) {
    if (zone.freeAbove && subtotal >= zone.freeAbove) {
      delivery = 0;
      deliveryNote = `Free above ${ksh(zone.freeAbove)}`;
    } else if (tier === "platinum" || (tier === "gold" && zone.goldFree)) {
      delivery = 0;
      deliveryNote = `Free for ${TIER_LABEL[tier]} members`;
    } else if (zone.freeAbove) deliveryNote = `Free above ${ksh(zone.freeAbove)}`;
  }

  const installOptions = services.filter((x) => cats.includes(x.category)).map((x) => ({ id: x.id, name: x.name, price: x.price }));
  const chosen = installOptions.filter((x) => input.installIds?.includes(x.id));
  const install = chosen.reduce((n, x) => n + x.price, 0) + (chosen.length && zone ? zone.installFee : 0);

  // One promo code per order (CK-7).
  let promo: { code: string; discount: number; error?: string } | null = null;
  const code = input.promoCode?.trim().toUpperCase();
  if (code) {
    const [pc] = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
    const now = new Date();
    const phone = normalisePhone(input.phone ?? "") ?? customer?.phone ?? null;
    let err = "";
    let discount = 0;
    if (!pc || !pc.active || (pc.startsAt && pc.startsAt > now) || (pc.endsAt && pc.endsAt < now)) err = "That code is not valid or has expired.";
    else if (pc.maxUses != null && pc.uses >= pc.maxUses) err = "That code has already been used.";
    else if (pc.phone && pc.phone !== phone) err = "That code belongs to a different phone number.";
    else if (subtotal < pc.minSubtotal) err = `That code needs an order of at least ${ksh(pc.minSubtotal)}.`;
    else if (pc.kind === "percent") discount = Math.floor((subtotal * Math.min(100, pc.value)) / 100);
    else if (pc.kind === "amount") discount = Math.min(pc.value, subtotal);
    else if (pc.kind === "price_match") {
      const line = lines.find((l) => l.productId === pc.productId);
      if (!line) err = "That price code is for a different product.";
      else discount = Math.max(0, line.price - pc.value);
    }
    promo = { code, discount: err ? 0 : discount, ...(err ? { error: err } : {}) };
  }
  const promoDiscount = promo?.discount ?? 0;

  // Points: 1 point = KSh 1, minimum balance, capped at a share of product value (RW-6).
  let available = 0;
  let pending = 0;
  if (customer) {
    await expireIfDue(customer, cfg);
    ({ available, pending } = await balances(customer.id));
  }
  const cap = Math.floor((subtotal * cfg.redeemCapPct) / 100);
  const beforePoints = subtotal + addons + delivery + install - promoDiscount;
  const redeemMax = customer && available >= cfg.redeemMin ? Math.max(0, Math.min(available, cap, beforePoints)) : 0;
  const pointsRedeemed = input.usePoints ? redeemMax : 0;
  const total = Math.max(0, beforePoints - pointsRedeemed);
  const pointsEarned = lines.reduce((n, l) => n + l.points + l.bonus, 0);

  let tierNudge = "";
  if (customer) {
    const next = nextTier(tier);
    if (next) {
      const need = cfg.threshold[next] - ((await spend12m(customer.id)) + subtotal);
      if (need > 0 && need <= cfg.threshold[next] * 0.5) tierNudge = `Spend ${ksh(need)} more to reach ${TIER_LABEL[next]} and ${TIER_NUDGE[next]}.`;
      else if (need <= 0) tierNudge = `This order takes you to ${TIER_LABEL[next]} once it's delivered.`;
    }
  }

  const suggestions = cfg.crossSellBonus > 0 && cats.length
    ? (await addOnProducts(cats, ids, 2)).map((p) => ({ id: p.id, name: p.name, path: productPath(p), image: productImage(p), price: activePrice(p).price, bonus: cfg.crossSellBonus, max: p.stockQty, modelNumber: p.modelNumber, laundry: false }))
    : [];

  const podOk = !!zone?.podAllowed && total <= Number(s.podCap);
  const deposit = total >= Number(s.depositThreshold) ? Math.ceil((total * Number(s.depositPct)) / 100 / 100) * 100 : 0;

  return {
    lines,
    subtotal,
    savings,
    addons,
    zone: zone ? { id: zone.id, name: zone.name, leadTime: zone.leadTime, podAllowed: zone.podAllowed } : null,
    delivery,
    deliveryNote,
    installOptions,
    install,
    chosenInstall: chosen,
    promo,
    promoDiscount,
    pointsRedeemed,
    redeemMax,
    available,
    pending,
    pointsEarned,
    total,
    tier,
    signedIn: !!customer,
    rewardsName: cfg.name,
    tierNudge,
    suggestions,
    podOk,
    podCap: Number(s.podCap),
    deposit,
    depositPct: Number(s.depositPct),
    errors: [...new Set(errors)],
  };
}
export type Quote = Awaited<ReturnType<typeof quote>>;

export type OrderInput = QuoteInput & {
  name: string;
  phone: string;
  email?: string;
  address: string;
  deliveryDate?: string;
  deliverySlot?: string;
  notes?: string;
  paymentMethod: "mpesa" | "pod";
  source?: string;
  marketingConsent?: boolean;
};

export type OrderResult = { ok: true; orderNumber: string; token: string; total: number } | { ok: false; error: string };

export function customerMessage(
  status: string,
  o: Pick<Order, "orderNumber" | "customerName" | "paymentMethod" | "total" | "deliveryDate" | "pointsEarned"> & Partial<Pick<Order, "driverName" | "driverPhone" | "deliverySlot">>,
  x: { till?: string; member?: boolean; rewardsName?: string; balance?: number; tierLine?: string; reviewUrl?: string } = {},
) {
  const hi = `Hi ${o.customerName.split(" ")[0]},`;
  const pts = o.pointsEarned > 0 ? (x.member ? ` You'll earn ${o.pointsEarned} points once it's delivered.` : ` Join ${x.rewardsName ?? "Rewards"} with this phone number to collect ${o.pointsEarned} points on it.`) : "";
  switch (status) {
    case "new":
      return `${hi} we've received your order ${o.orderNumber} (${ksh(o.total)}). ${
        o.paymentMethod === "mpesa"
          ? `Pay via M-Pesa Till ${x.till} using ${o.orderNumber} as the reference, then send us the M-Pesa code.`
          : "Our sales team will call you shortly to confirm. You pay on delivery via M-Pesa."
      }${pts}`;
    case "awaiting_payment":
      return `${hi} a friendly reminder: order ${o.orderNumber} is awaiting payment. M-Pesa Till ${x.till}, reference ${o.orderNumber}. Reply here if you need help.`;
    case "confirmed":
      return `${hi} order ${o.orderNumber} is confirmed. We'll message you the delivery window shortly. Thank you!`;
    case "scheduled":
      return `${hi} order ${o.orderNumber} is booked for delivery${o.deliveryDate ? ` on ${o.deliveryDate}` : ""}${o.deliverySlot ? `, ${o.deliverySlot}` : ""}.`;
    case "dispatched":
      return `${hi} order ${o.orderNumber} is on its way.${o.driverName ? ` Your driver is ${o.driverName}${o.driverPhone ? ` (${o.driverPhone})` : ""}.` : ""} They will call before arriving.`;
    case "delivered":
      return `${hi} your order ${o.orderNumber} has been delivered. Thank you for shopping with us!${
        o.pointsEarned > 0 && x.member ? ` ${o.pointsEarned} points are now available. Your balance: ${x.balance ?? 0} points.${x.tierLine ? ` ${x.tierLine}` : ""}` : ""
      }${x.reviewUrl ? ` Tell other buyers what you think: ${x.reviewUrl}` : ""}`;
    case "cancelled":
      return `${hi} order ${o.orderNumber} has been cancelled. Any points on it have been reversed. Message us if this is a mistake.`;
    case "refunded":
      return `${hi} order ${o.orderNumber} has been refunded. Please allow a few days for M-Pesa to reflect it. Points on it have been reversed.`;
    default:
      return `${hi} update on order ${o.orderNumber}: ${statusLabel(status)}.`;
  }
}

export async function createOrder(input: OrderInput, member: Customer | null): Promise<OrderResult> {
  const phone = normalisePhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid Kenyan phone number (07xx or 01xx)." };
  if (!input.name.trim() || !input.address.trim()) return { ok: false, error: "Name and delivery address are required." };
  if (!input.lines.length) return { ok: false, error: "Your cart is empty." };

  const q = await quote({ ...input, phone }, member);
  if (q.errors.length) return { ok: false, error: q.errors[0] };
  if (!q.zone) return { ok: false, error: "Choose a delivery area." };
  if (q.promo?.error) return { ok: false, error: q.promo.error };
  if (input.paymentMethod === "pod") {
    if (!q.zone.podAllowed) return { ok: false, error: "Pay on Delivery is not available for this area. Please choose M-Pesa." };
    if (q.total > q.podCap) return { ok: false, error: `Pay on Delivery is only available for orders up to ${ksh(q.podCap)}.` };
  }

  const s = await getSettings();
  const year = new Date().getFullYear();
  const token = crypto.randomBytes(16).toString("hex");

  let created: Order;
  let isMember = !!member;
  try {
    created = await db.transaction(async (tx) => {
      // Every buyer becomes a contactable customer record (goal 4); points wait for them to join.
      let customerId = member?.id;
      if (!customerId) {
        await tx.insert(customers).values({ phone, name: input.name.trim(), email: input.email?.trim() || null }).onConflictDoNothing();
        const [c] = await tx.select().from(customers).where(eq(customers.phone, phone)).limit(1);
        customerId = c.id;
        isMember = !!c.joinedAt;
      }
      if (input.marketingConsent) await tx.update(customers).set({ marketingConsent: true }).where(eq(customers.id, customerId));
      await tx.update(customers).set({ lastPurchaseAt: new Date() }).where(eq(customers.id, customerId));

      if (q.promo && q.promoDiscount > 0) {
        const used = await tx
          .update(promoCodes)
          .set({ uses: sql`${promoCodes.uses} + 1` })
          .where(and(eq(promoCodes.code, q.promo.code), or(isNull(promoCodes.maxUses), lt(promoCodes.uses, promoCodes.maxUses))))
          .returning({ id: promoCodes.id });
        if (!used.length) throw new Error("That code has already been used.");
      }

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
          zoneId: q.zone!.id,
          zoneName: q.zone!.name,
          address: input.address.trim(),
          deliveryDate: input.deliveryDate || null,
          deliverySlot: input.deliverySlot || null,
          installation: q.chosenInstall.length > 0,
          installServices: q.chosenInstall.map((x) => ({ name: x.name, price: x.price })),
          notes: input.notes?.trim() || null,
          paymentMethod: input.paymentMethod,
          status: input.paymentMethod === "mpesa" ? "awaiting_payment" : "new",
          customerId,
          subtotal: q.subtotal,
          savings: q.savings,
          addonsTotal: q.addons,
          deliveryFee: q.delivery,
          installFee: q.install,
          promoCode: q.promoDiscount > 0 ? q.promo!.code : null,
          promoDiscount: q.promoDiscount,
          pointsRedeemed: q.pointsRedeemed,
          pointsEarned: q.pointsEarned,
          total: q.total,
          depositRequired: q.deposit,
          source: input.source || "website",
        })
        .returning();
      await tx.insert(orderItems).values(
        q.lines.map((l) => ({
          orderId: o.id,
          productId: l.productId,
          name: l.name,
          modelNumber: l.modelNumber,
          category: l.category,
          unitPrice: l.price,
          qty: l.qty,
          extendedWarranty: l.warrantyPrice > 0,
          warrantyPrice: l.warrantyPrice,
          pedestal: l.pedestalPrice > 0,
          pedestalPrice: l.pedestalPrice,
        })),
      );
      for (const l of q.lines) {
        await tx
          .update(products)
          .set({
            stockQty: sql`greatest(${products.stockQty} - ${l.qty}, 0)`,
            popularity: sql`${products.popularity} + 1`,
            ...(l.onOffer ? { offerSold: sql`${products.offerSold} + ${l.qty}` } : {}),
          })
          .where(eq(products.id, l.productId));
      }
      // Earned points stay pending until delivery (RW-2); redeemed points leave the balance now.
      const ledger: (typeof pointsLedger.$inferInsert)[] = [];
      const earned = q.lines.reduce((n, l) => n + l.points, 0);
      const bonus = q.lines.reduce((n, l) => n + l.bonus, 0);
      if (earned) ledger.push({ customerId, orderId: o.id, type: "earn", points: earned, status: "pending", reason: `Order ${orderNumber}` });
      if (bonus) ledger.push({ customerId, orderId: o.id, type: "bonus", points: bonus, status: "pending", reason: `Add-on bonus, order ${orderNumber}` });
      if (q.pointsRedeemed) ledger.push({ customerId, orderId: o.id, type: "redeem", points: -q.pointsRedeemed, status: "available", reason: `Used on order ${orderNumber}` });
      if (ledger.length) await tx.insert(pointsLedger).values(ledger);
      return o;
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message.startsWith("That code") ? e.message : "Could not place the order. Please try again." };
  }

  await queueMessage({
    audience: "customer",
    recipient: phone,
    subject: `Order received ${created.orderNumber}`,
    message: customerMessage("new", created, { till: s.tillNumber, member: isMember, rewardsName: s.rewardsName }),
    refType: "order",
    refId: created.id,
  });
  await queueMessage({
    audience: "admin",
    recipient: s.whatsapp,
    subject: `New order ${created.orderNumber}`,
    message: `New ${created.source} order ${created.orderNumber} from ${created.customerName} (${phone}) — ${ksh(created.total)} · ${created.paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"} · ${created.zoneName}${created.pointsRedeemed ? ` · ${created.pointsRedeemed} points used` : ""}`,
    refType: "order",
    refId: created.id,
  });

  return { ok: true, orderNumber: created.orderNumber, token: created.token, total: created.total };
}

// Stock, points and customer message side effects of an admin status change.
export async function changeOrderStatus(o: Order, status: string, actor: string, extra: Partial<Pick<Order, "deliveryDate" | "deliverySlot" | "driverName" | "driverPhone" | "mpesaCode">>) {
  await db.update(orders).set({ status, ...extra }).where(eq(orders.id, o.id));
  const next = { ...o, ...extra, status };

  if (isDead(status) !== isDead(o.status)) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    for (const i of items) {
      if (!i.productId) continue;
      const delta = isDead(status) ? i.qty : -i.qty;
      await db.update(products).set({ stockQty: sql`greatest(${products.stockQty} + ${delta}, 0)` }).where(eq(products.id, i.productId));
    }
  }

  const cfg = await getRewardsConfig();
  let balance = 0;
  let tierLine = "";
  let member = false;
  if (o.customerId) {
    const [c] = await db.select().from(customers).where(eq(customers.id, o.customerId)).limit(1);
    member = !!c?.joinedAt;
    const rows = await db.select().from(pointsLedger).where(eq(pointsLedger.orderId, o.id));
    if (isDead(status) && !isDead(o.status)) {
      // Reverse everything this order earned and give back any points spent on it.
      await db.update(pointsLedger).set({ status: "void" }).where(and(eq(pointsLedger.orderId, o.id), eq(pointsLedger.status, "pending")));
      const earnedAvailable = rows.filter((r) => r.status === "available" && (r.type === "earn" || r.type === "bonus")).reduce((n, r) => n + r.points, 0);
      const redeemed = -rows.filter((r) => r.type === "redeem").reduce((n, r) => n + r.points, 0);
      const alreadyReversed = rows.some((r) => r.type === "reverse");
      if (!alreadyReversed) {
        if (earnedAvailable) await addPoints({ customerId: o.customerId, orderId: o.id, type: "reverse", points: -earnedAvailable, reason: `Order ${o.orderNumber} ${status}`, actor });
        if (redeemed) await addPoints({ customerId: o.customerId, orderId: o.id, type: "reverse", points: redeemed, reason: `Points returned, order ${o.orderNumber} ${status}`, actor });
      }
    }
    if (status === "delivered" && o.status !== "delivered") {
      await db.update(pointsLedger).set({ status: "available" }).where(and(eq(pointsLedger.orderId, o.id), eq(pointsLedger.status, "pending")));
      if (c) {
        const { tier, spend, upgraded } = await refreshTier(c, cfg);
        const nt = nextTier(tier);
        tierLine = upgraded
          ? `Congratulations, you are now ${TIER_LABEL[tier]}!`
          : nt
            ? `${ksh(Math.max(0, cfg.threshold[nt] - spend))} more spend to reach ${TIER_LABEL[nt]}.`
            : "";
      }
    }
    balance = (await balances(o.customerId)).available;
  }

  if (status !== o.status) {
    const s = await getSettings();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    await queueMessage({
      audience: "customer",
      recipient: o.phone,
      subject: `${o.orderNumber}: ${statusLabel(status)}`,
      message: customerMessage(status, next, { till: s.tillNumber, member, rewardsName: s.rewardsName, balance, tierLine, reviewUrl: status === "delivered" && site ? `${site}/order/${o.token}#review` : undefined }),
      refType: "order",
      refId: o.id,
    });
  }
}
