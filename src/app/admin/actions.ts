"use server";

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  adminUsers,
  categories,
  content,
  customers,
  deliveryZones,
  installServices,
  leads,
  orders,
  products,
  promoCodes,
  reviews,
  rewardCampaigns,
  settings,
} from "@/db/schema";
import { authenticate, createSession, destroySession, hashPassword, MIN_PASSWORD_LENGTH, passwordMatches, ROLES, type Role } from "@/lib/auth";
import { catDef } from "@/lib/catalog";
import { isBlockKey, sanitizeBlock } from "@/lib/content-schema";
import { parseCsv, productFieldsFromCsv } from "@/lib/csv";
import { ksh, normalisePhone, slugify } from "@/lib/format";
import { guard } from "@/lib/guard";
import { queueMessage } from "@/lib/messages";
import { changeOrderStatus, createOrder, logAudit } from "@/lib/orders";
import { floorPrice, suggestedPrice } from "@/lib/pricing";
import { marginFloorFor } from "@/lib/queries";
import { addPoints, getRewardsConfig } from "@/lib/rewards";
import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";
import { newTotpSecret, verifyTotp } from "@/lib/totp";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};
// Admin times are Nairobi time (UTC+3).
const nairobi = (v: string, endOfDay = false) => {
  if (!v) return null;
  const d = new Date(v.length === 10 ? `${v}T${endOfDay ? "23:59:59" : "00:00:00"}+03:00` : `${v}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const date = (fd: FormData, k: string, endOfDay = false) => nairobi(str(fd, k), endOfDay);
const back = (path: string, error: string): never => redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`);

async function checkFloor(category: string, cost: number | null | undefined, prices: (number | null | undefined)[]) {
  const floor = floorPrice(cost, await marginFloorFor(category));
  const low = prices.find((p) => p != null && floor != null && p < floor);
  return low != null && floor != null ? `KSh ${low.toLocaleString()} is below the margin floor of ${ksh(floor)} for this category. Raise the price or check the cost.` : null;
}

export async function login(_prev: { error?: string } | undefined, fd: FormData) {
  const res = await authenticate(str(fd, "username"), String(fd.get("password") ?? ""), str(fd, "code"));
  if (!res.ok) return { error: res.error };
  await createSession(res.user);
  await logAudit(res.user.username, "login", "session");
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------- catalogue ----------

export async function saveProduct(fd: FormData) {
  const actor = await guard("content", "pricing");
  const id = int(fd, "id");
  const path = `/admin/products/${id ?? "new"}`;
  const name = str(fd, "name");
  const model = str(fd, "modelNumber");
  const [category, subcategory = ""] = str(fd, "catsub").split("/");
  const def = catDef(category);
  if (!def || !def.subs.some((s) => s.slug === subcategory)) {
    const [row] = subcategory ? await db.select().from(categories).where(eq(categories.slug, `${category}/${subcategory}`)).limit(1) : [];
    if (!def || !row) back(path, "Choose a category and sub-category.");
  }
  const specs: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (k.startsWith("spec_") && String(v).trim()) specs[k.slice(5)] = String(v).trim().slice(0, 200);
  const data = {
    name,
    brand: str(fd, "brand") || "MIKA",
    modelNumber: model,
    slug: slugify(str(fd, "slug") || `${name}-${model}`),
    category,
    subcategory,
    type: str(fd, "type") || def?.subs.find((s) => s.slug === subcategory)?.name || "Appliance",
    specs,
    washCapacityKg: int(fd, "washCapacityKg"),
    dryCapacityKg: int(fd, "dryCapacityKg"),
    spinRpm: int(fd, "spinRpm"),
    energyRating: str(fd, "energyRating") || null,
    motor: str(fd, "motor") || "Standard",
    features: fd.getAll("features").map(String),
    warranty: str(fd, "warranty") || "1-year general warranty",
    priceKsh: int(fd, "priceKsh") ?? 0,
    wasPriceKsh: int(fd, "wasPriceKsh"),
    costKsh: int(fd, "costKsh"),
    competitorPriceKsh: int(fd, "competitorPriceKsh"),
    competitorWasKsh: int(fd, "competitorWasKsh"),
    competitorCheckedAt: date(fd, "competitorCheckedAt"),
    offerPriceKsh: int(fd, "offerPriceKsh"),
    offerStart: date(fd, "offerStart"),
    offerEnd: date(fd, "offerEnd", true),
    offerBadge: str(fd, "offerBadge") || null,
    offerQtyCap: int(fd, "offerQtyCap"),
    stockQty: int(fd, "stockQty") ?? 0,
    lowStockAt: int(fd, "lowStockAt") ?? 2,
    colour: str(fd, "colour") || null,
    dimensionsCm: str(fd, "dimensionsCm") || null,
    weightKg: int(fd, "weightKg"),
    images: str(fd, "images").split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    videoUrl: str(fd, "videoUrl") || null,
    manualPdf: str(fd, "manualPdf") || null,
    shortBenefit: str(fd, "shortBenefit"),
    description: str(fd, "description"),
    seoTitle: str(fd, "seoTitle") || null,
    metaDescription: str(fd, "metaDescription") || null,
    featured: fd.get("featured") === "on",
    archived: fd.get("archived") === "on",
    isSample: fd.get("isSample") === "on",
  };
  if (!name || !model || data.priceKsh <= 0) back(path, "Name, model and price are required.");
  if (data.wasPriceKsh != null && data.wasPriceKsh <= data.priceKsh) back(path, "The was-price must be higher than the price, and only a genuine prior or recommended price.");
  if (data.offerPriceKsh != null && data.offerPriceKsh >= data.priceKsh) back(path, "The sale price must be lower than the regular price.");
  if (data.offerQtyCap != null && !data.offerEnd) back(path, "A flash sale needs an end date and time.");
  const floorError = await checkFloor(category, data.costKsh, [data.priceKsh, data.offerPriceKsh]);
  if (floorError) back(path, floorError);

  let saved: number | undefined;
  try {
    if (id) {
      const [cur] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      const offerChanged = cur && (cur.offerStart?.getTime() !== data.offerStart?.getTime() || cur.offerPriceKsh !== data.offerPriceKsh || cur.offerQtyCap !== data.offerQtyCap);
      await db.update(products).set({ ...data, ...(offerChanged ? { offerSold: 0 } : {}) }).where(eq(products.id, id));
      saved = id;
      if (cur && cur.priceKsh !== data.priceKsh) await logAudit(actor.username, "price", "product", id, `${cur.priceKsh} → ${data.priceKsh}`);
      await logAudit(actor.username, "update", "product", id, `${name} · price ${data.priceKsh} · stock ${data.stockQty}`);
    } else {
      const [p] = await db.insert(products).values(data).returning();
      saved = p.id;
      await logAudit(actor.username, "create", "product", p.id, name);
    }
  } catch {
    back(path, "Model number or URL slug already exists");
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=${saved}`);
}

export async function quickUpdateProduct(fd: FormData) {
  const actor = await guard("content", "pricing");
  const id = int(fd, "id")!;
  const price = int(fd, "priceKsh") ?? 0;
  if (price <= 0) back("/admin/products", "Enter a price.");
  const offer = int(fd, "offerPriceKsh");
  const [cur] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!cur) return;
  if (offer != null && offer >= price) back("/admin/products", `${cur.name}: the sale price must be lower than the regular price.`);
  const floorError = await checkFloor(cur.category, cur.costKsh, [price, offer]);
  if (floorError) back("/admin/products", `${cur.name}: ${floorError}`);
  const set = {
    priceKsh: price,
    offerPriceKsh: offer,
    offerEnd: date(fd, "offerEnd", true),
    offerStart: offer ? (cur.offerStart ?? new Date()) : null,
    stockQty: int(fd, "stockQty") ?? 0,
  };
  await db.update(products).set(set).where(eq(products.id, id));
  await logAudit(actor.username, "price", "product", id, `price ${cur.priceKsh} → ${price}, offer ${offer ?? "none"}, stock ${set.stockQty}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}

export async function toggleArchive(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id")!;
  const archived = str(fd, "archived") === "1";
  await db.update(products).set({ archived: !archived }).where(eq(products.id, id));
  await logAudit(actor.username, archived ? "restore" : "archive", "product", id);
  revalidatePath("/", "layout");
}

export async function archiveSampleProducts() {
  const actor = await guard("owner");
  const rows = await db.update(products).set({ archived: true }).where(and(eq(products.isSample, true), eq(products.archived, false))).returning({ id: products.id });
  await logAudit(actor.username, "archive-samples", "product", undefined, `${rows.length} sample products archived`);
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=samples`);
}

export async function importProducts(fd: FormData) {
  const actor = await guard("content", "pricing");
  const file = fd.get("file");
  const rows = parseCsv(file && typeof file !== "string" ? await file.text() : "");
  let created = 0;
  let updated = 0;
  const problems: string[] = [];
  for (const [n, r] of rows.entries()) {
    const line = n + 2;
    const model = r.modelNumber;
    if (!model) {
      problems.push(`Row ${line}: no modelNumber`);
      continue;
    }
    const fields = productFieldsFromCsv(r) as Partial<typeof products.$inferInsert>;
    if (fields.category) {
      const def = catDef(fields.category);
      if (!def) {
        problems.push(`Row ${line}: unknown category "${fields.category}"`);
        continue;
      }
      if (fields.subcategory && !def.subs.some((s) => s.slug === fields.subcategory)) {
        problems.push(`Row ${line}: unknown sub-category "${fields.subcategory}" for ${fields.category}`);
        continue;
      }
    }
    if (r.slug) fields.slug = slugify(r.slug);
    try {
      const [existing] = await db.select().from(products).where(eq(products.modelNumber, model)).limit(1);
      const category = fields.category ?? existing?.category ?? "";
      const floorError = await checkFloor(category, fields.costKsh ?? existing?.costKsh, [fields.priceKsh, fields.offerPriceKsh]);
      if (floorError) {
        problems.push(`Row ${line} (${model}): ${floorError}`);
        continue;
      }
      if (existing) {
        if (Object.keys(fields).length) await db.update(products).set(fields).where(eq(products.id, existing.id));
        if (fields.priceKsh != null && fields.priceKsh !== existing.priceKsh) await logAudit(actor.username, "price", "product", existing.id, `${existing.priceKsh} → ${fields.priceKsh} (import)`);
        updated++;
      } else if (!fields.name || !fields.category || !fields.subcategory || !fields.priceKsh) {
        problems.push(`Row ${line}: new product needs name, category, subcategory and priceKsh`);
      } else {
        await db.insert(products).values({ ...fields, name: fields.name, category: fields.category, priceKsh: fields.priceKsh, modelNumber: model, slug: fields.slug ?? slugify(`${fields.name}-${model}`) });
        created++;
      }
    } catch {
      problems.push(`Row ${line}: could not save ${model} (duplicate URL slug?)`);
    }
  }
  await logAudit(actor.username, "import", "product", undefined, `${created} created, ${updated} updated, ${problems.length} failed`);
  revalidatePath("/", "layout");
  const q = new URLSearchParams({ created: String(created), updated: String(updated), problems: problems.slice(0, 10).join("\n") });
  redirect(`/admin/products/import?${q}`);
}

export async function saveCategory(fd: FormData) {
  const actor = await guard("content");
  const slug = str(fd, "slug");
  const parent = str(fd, "parent") || null;
  const name = str(fd, "name");
  if (!slug || !name) back("/admin/categories", "A name is required.");
  const row = {
    name,
    parent,
    tileImage: str(fd, "tileImage") || null,
    menuOrder: int(fd, "menuOrder") ?? 0,
    active: fd.get("active") === "on",
    intro: str(fd, "intro") || null,
    ...(parent ? {} : { isCore: fd.get("isCore") === "on", marginFloorPct: int(fd, "marginFloorPct") }),
  };
  await db.insert(categories).values({ slug, ...row }).onConflictDoUpdate({ target: categories.slug, set: row });
  await logAudit(actor.username, "update", "category", slug, row.marginFloorPct != null ? `margin floor ${row.marginFloorPct}%` : undefined);
  revalidatePath("/", "layout");
  redirect(`/admin/categories?saved=1#${encodeURIComponent(slug)}`);
}

export async function addSubcategory(fd: FormData) {
  const actor = await guard("content");
  const parent = str(fd, "parent");
  const name = str(fd, "name");
  if (!catDef(parent) || !name) back("/admin/categories", "Choose a category and enter a name.");
  const slug = `${parent}/${slugify(name)}`;
  await db.insert(categories).values({ slug, parent, name, menuOrder: 99 }).onConflictDoNothing();
  await logAudit(actor.username, "create", "category", slug);
  revalidatePath("/", "layout");
  redirect(`/admin/categories?saved=1#${encodeURIComponent(slug)}`);
}

// ---------- pricing & deals ----------

export async function savePricing(fd: FormData) {
  const actor = await guard("pricing");
  const id = int(fd, "id")!;
  const ret = str(fd, "returnTo") || "/admin/pricing";
  const [cur] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!cur) return;
  const competitor = int(fd, "competitorPriceKsh");
  const cost = int(fd, "costKsh");
  let price = int(fd, "priceKsh") ?? cur.priceKsh;
  if (fd.get("useSuggested") && competitor) price = suggestedPrice(competitor);
  const was = int(fd, "wasPriceKsh");
  if (was != null && was <= price) back(ret, `${cur.modelNumber}: the was-price must be higher than the price.`);
  const floorError = await checkFloor(cur.category, cost, [price, cur.offerPriceKsh]);
  if (floorError) back(ret, `${cur.modelNumber}: ${floorError}`);
  const competitorChanged = competitor !== cur.competitorPriceKsh || int(fd, "competitorWasKsh") !== cur.competitorWasKsh;
  await db
    .update(products)
    .set({
      priceKsh: price,
      wasPriceKsh: was,
      costKsh: cost,
      competitorPriceKsh: competitor,
      competitorWasKsh: int(fd, "competitorWasKsh"),
      ...(competitor && (competitorChanged || fd.get("markChecked")) ? { competitorCheckedAt: new Date() } : {}),
    })
    .where(eq(products.id, id));
  await logAudit(actor.username, "price", "product", id, `price ${cur.priceKsh} → ${price}; competitor ${cur.competitorPriceKsh ?? "—"} → ${competitor ?? "—"}; cost ${cost ?? "—"}`);
  revalidatePath("/", "layout");
  redirect(`${ret}${ret.includes("?") ? "&" : "?"}saved=${id}#p${id}`);
}

export async function savePromo(fd: FormData) {
  const actor = await guard("pricing");
  const id = int(fd, "id");
  const code = str(fd, "code").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const kind = ["percent", "amount", "price_match"].includes(str(fd, "kind")) ? str(fd, "kind") : "amount";
  const value = int(fd, "value") ?? 0;
  if (code.length < 3 || value <= 0) back("/admin/deals", "Enter a code (3+ letters) and a value.");
  if (kind === "percent" && value > 50) back("/admin/deals", "Percentage codes are capped at 50%.");
  const phoneRaw = str(fd, "phone");
  const data = {
    code,
    kind,
    value,
    productId: int(fd, "productId"),
    phone: phoneRaw ? normalisePhone(phoneRaw) : null,
    minSubtotal: int(fd, "minSubtotal") ?? 0,
    maxUses: int(fd, "maxUses"),
    startsAt: date(fd, "startsAt"),
    endsAt: date(fd, "endsAt", true),
    active: fd.get("active") === "on",
    note: str(fd, "note") || null,
  };
  try {
    if (id) await db.update(promoCodes).set(data).where(eq(promoCodes.id, id));
    else await db.insert(promoCodes).values(data);
  } catch {
    back("/admin/deals", "That code already exists.");
  }
  await logAudit(actor.username, id ? "update" : "create", "promo", code, `${kind} ${value}`);
  redirect("/admin/deals?saved=1");
}

// ---------- rewards ----------

export async function saveCampaign(fd: FormData) {
  const actor = await guard("owner");
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    multiplier: Math.min(3, Math.max(2, int(fd, "multiplier") ?? 2)),
    scope: ["all", "category", "brand", "product"].includes(str(fd, "scope")) ? str(fd, "scope") : "all",
    scopeValue: str(fd, "scopeValue") || null,
    startsAt: date(fd, "startsAt") ?? new Date(),
    endsAt: date(fd, "endsAt", true) ?? new Date(),
    active: fd.get("active") === "on",
  };
  if (!data.name || data.endsAt <= data.startsAt) back("/admin/rewards", "A campaign needs a name and an end after its start.");
  if (id) await db.update(rewardCampaigns).set(data).where(eq(rewardCampaigns.id, id));
  else await db.insert(rewardCampaigns).values(data);
  await logAudit(actor.username, id ? "update" : "create", "campaign", id ?? undefined, `${data.name} ${data.multiplier}×`);
  revalidatePath("/", "layout");
  redirect("/admin/rewards?saved=1");
}

export async function adjustPoints(fd: FormData) {
  const actor = await guard("owner");
  const customerId = int(fd, "customerId")!;
  const points = int(fd, "points") ?? 0;
  const reason = str(fd, "reason");
  if (!points || reason.length < 3) back(`/admin/customers/${customerId}`, "Enter the points (+ or −) and a reason.");
  await addPoints({ customerId, type: "adjust", points, reason, actor: actor.username });
  await logAudit(actor.username, "points", "customer", customerId, `${points > 0 ? "+" : ""}${points}: ${reason}`);
  redirect(`/admin/customers/${customerId}?saved=1`);
}

// ---------- orders & leads ----------

export async function updateOrderStatus(fd: FormData) {
  const actor = await guard("sales", "fulfilment");
  const id = int(fd, "id")!;
  const status = str(fd, "status");
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return;
  const code = str(fd, "mpesaCode").toUpperCase();
  await changeOrderStatus(o, status, actor.username, {
    ...(code ? { mpesaCode: code } : {}),
    deliveryDate: str(fd, "deliveryDate") || o.deliveryDate,
    deliverySlot: str(fd, "deliverySlot") || o.deliverySlot,
    driverName: str(fd, "driverName") || null,
    driverPhone: str(fd, "driverPhone") || null,
  });
  await logAudit(actor.username, "status", "order", id, `${o.status} → ${status}${code ? ` · M-Pesa ${code}` : ""}`);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function createManualOrder(fd: FormData) {
  const actor = await guard("sales");
  const qtys = fd.getAll("qty");
  const lines = fd
    .getAll("productId")
    .map((v, i) => ({ productId: Number(v), qty: Number(qtys[i]) || 1 }))
    .filter((l) => l.productId > 0);
  const res = await createOrder(
    {
      name: str(fd, "name"),
      phone: str(fd, "phone"),
      zoneId: int(fd, "zoneId"),
      address: str(fd, "address"),
      installIds: fd.getAll("installIds").map(Number),
      promoCode: str(fd, "promoCode") || undefined,
      paymentMethod: str(fd, "paymentMethod") === "pod" ? "pod" : "mpesa",
      source: str(fd, "source") || "whatsapp",
      notes: str(fd, "notes"),
      lines,
    },
    null,
  );
  if (!res.ok) redirect(`/admin/orders/new?error=${encodeURIComponent(res.error)}`);
  const [o] = await db.select().from(orders).where(eq(orders.token, res.token)).limit(1);
  await logAudit(actor.username, "create", "order", o.id, `${res.orderNumber} (manual, ${o.source})`);
  redirect(`/admin/orders/${o.id}`);
}

export async function updateLead(fd: FormData) {
  const actor = await guard("sales", "pricing");
  const id = int(fd, "id")!;
  const status = str(fd, "status");
  const assignee = str(fd, "assignee") || null;
  await db.update(leads).set({ status, assignee }).where(eq(leads.id, id));
  await logAudit(actor.username, "update", "lead", id, `${status}${assignee ? ` · ${assignee}` : ""}`);
  revalidatePath("/admin/leads");
}

export async function deleteLead(fd: FormData) {
  const actor = await guard("owner");
  const id = int(fd, "id")!;
  await db.delete(leads).where(eq(leads.id, id));
  await logAudit(actor.username, "delete", "lead", id, "data deletion");
  revalidatePath("/admin/leads");
}

// Best Price Promise: approve with a one-time price code for that phone and product (PRD BP-2).
export async function issuePriceCode(fd: FormData) {
  const actor = await guard("sales", "pricing");
  const id = int(fd, "id")!;
  const price = int(fd, "price");
  const [l] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!l || !l.productId || !l.phone || !price || price <= 0) back("/admin/leads?type=price_match", "Enter the matched price.");
  const [p] = await db.select().from(products).where(eq(products.id, l!.productId!)).limit(1);
  const floorError = p ? await checkFloor(p.category, p.costKsh, [price]) : null;
  if (floorError) back("/admin/leads?type=price_match", `Cannot match: ${floorError}`);
  const code = `PM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const endsAt = new Date(Date.now() + 7 * 86_400_000);
  await db.insert(promoCodes).values({ code, kind: "price_match", value: price!, productId: l!.productId, phone: l!.phone, maxUses: 1, endsAt, note: `Price match, lead #${id}` });
  await db.update(leads).set({ status: "won", details: { ...l!.details, code, matchedPrice: String(price) } }).where(eq(leads.id, id));
  await queueMessage({
    audience: "customer",
    recipient: l!.phone!,
    subject: "Your price-match code",
    message: `Hi ${l!.name?.split(" ")[0] ?? ""}, good news: we've matched the price of ${l!.productName ?? "your product"} at ${ksh(price)}. Use code ${code} at checkout with this phone number before ${endsAt.toLocaleDateString("en-KE")}. You still earn points!`,
    refType: "lead",
    refId: id,
  });
  await logAudit(actor.username, "price-match", "lead", id, `${code} at ${price}`);
  redirect("/admin/leads?type=price_match&saved=1");
}

// Warranty registration earns bonus points once staff have checked it.
export async function approveWarranty(fd: FormData) {
  const actor = await guard("sales");
  const id = int(fd, "id")!;
  const [l] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!l || !l.phone || l.details.awarded) redirect("/admin/leads?type=warranty");
  const cfg = await getRewardsConfig();
  await db.insert(customers).values({ phone: l.phone, name: l.name }).onConflictDoNothing();
  const [c] = await db.select().from(customers).where(eq(customers.phone, l.phone)).limit(1);
  await addPoints({ customerId: c.id, type: "bonus", points: cfg.warrantyBonus, reason: `Warranty registered: ${l.productName ?? "product"}`, actor: actor.username });
  await db.update(leads).set({ status: "won", details: { ...l.details, awarded: String(cfg.warrantyBonus) } }).where(eq(leads.id, id));
  const s = await getSettings();
  await queueMessage({
    audience: "customer",
    recipient: l.phone,
    subject: "Warranty registered",
    message: `Hi ${l.name?.split(" ")[0] ?? ""}, your warranty for ${l.productName ?? "your product"} is registered.${c.joinedAt ? ` ${cfg.warrantyBonus} bonus points are in your account.` : ` Join ${s.rewardsName} with this number to collect ${cfg.warrantyBonus} bonus points.`}`,
    refType: "lead",
    refId: id,
  });
  await logAudit(actor.username, "warranty", "lead", id, `+${cfg.warrantyBonus} points`);
  redirect("/admin/leads?type=warranty&saved=1");
}

// ---------- delivery, reviews, content ----------

export async function saveZone(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    fee: int(fd, "fee") ?? 0,
    freeAbove: int(fd, "freeAbove"),
    goldFree: fd.get("goldFree") === "on",
    installFee: int(fd, "installFee") ?? 0,
    podAllowed: fd.get("podAllowed") === "on",
    leadTime: str(fd, "leadTime") || "1–2 days",
    active: fd.get("active") === "on",
  };
  if (!data.name) return;
  if (id) await db.update(deliveryZones).set(data).where(eq(deliveryZones.id, id));
  else await db.insert(deliveryZones).values(data).onConflictDoNothing();
  await logAudit(actor.username, id ? "update" : "create", "zone", id ?? undefined, `${data.name} fee ${data.fee}`);
  revalidatePath("/admin/zones");
  revalidatePath("/", "layout");
}

export async function saveInstallService(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id");
  const data = { name: str(fd, "name"), category: str(fd, "category"), price: int(fd, "price") ?? 0, active: fd.get("active") === "on" };
  if (!data.name || !catDef(data.category)) return;
  if (id) await db.update(installServices).set(data).where(eq(installServices.id, id));
  else await db.insert(installServices).values(data);
  await logAudit(actor.username, id ? "update" : "create", "install-service", id ?? undefined, `${data.name} ${data.price}`);
  revalidatePath("/admin/zones");
  revalidatePath("/", "layout");
}

// Staff can publish, hide or reply to reviews; they cannot change a rating or the buyer's words (PRD RV-2).
export async function moderateReview(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id")!;
  const published = fd.get("published") === "on";
  const reply = str(fd, "reply").slice(0, 1000) || null;
  await db.update(reviews).set({ published, reply }).where(eq(reviews.id, id));
  await logAudit(actor.username, published ? "publish" : "hide", "review", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/reviews");
}

export async function deleteReview(fd: FormData) {
  const actor = await guard("owner");
  const id = int(fd, "id")!;
  await db.delete(reviews).where(eq(reviews.id, id));
  await logAudit(actor.username, "delete", "review", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/reviews");
}

export async function saveContent(fd: FormData) {
  const actor = await guard("content");
  const key = str(fd, "key");
  if (!isBlockKey(key)) return;
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("json") ?? ""));
  } catch {
    redirect(`/admin/content/${key}?error=Could not read the form. Please try again.`);
  }
  const value = sanitizeBlock(key, raw);
  const row = { value, updatedBy: actor.username, updatedAt: new Date() };
  await db.insert(content).values({ key, ...row }).onConflictDoUpdate({ target: content.key, set: row });
  await logAudit(actor.username, "update", "content", key);
  revalidatePath("/", "layout");
  redirect(`/admin/content/${key}?saved=1`);
}

export async function resetContent(fd: FormData) {
  const actor = await guard("content");
  const key = str(fd, "key");
  if (!isBlockKey(key)) return;
  await db.delete(content).where(eq(content.key, key));
  await logAudit(actor.username, "reset", "content", key);
  revalidatePath("/", "layout");
  redirect(`/admin/content/${key}?saved=1`);
}

export async function saveSettings(fd: FormData) {
  const actor = await guard("owner");
  for (const key of Object.keys(SETTING_DEFAULTS)) {
    const v = str(fd, key);
    if (fd.has(key)) {
      await db.insert(settings).values({ key, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
    }
  }
  await logAudit(actor.username, "update", "settings", undefined, str(fd, "returnTo") === "/admin/rewards" ? "rewards rules" : undefined);
  revalidatePath("/", "layout");
  redirect(`${str(fd, "returnTo") === "/admin/rewards" ? "/admin/rewards" : "/admin/settings"}?saved=1`);
}

// ---------- users ----------

export async function saveUser(fd: FormData) {
  const me = await guard("owner");
  const id = int(fd, "id");
  const username = str(fd, "username").toLowerCase();
  const name = str(fd, "name");
  const password = String(fd.get("password") ?? "");
  const role = (ROLES as readonly string[]).includes(str(fd, "role")) ? (str(fd, "role") as Role) : "sales";
  const active = fd.get("active") === "on";
  const fail = (m: string) => redirect(`/admin/users?error=${encodeURIComponent(m)}`);
  if (!name) fail("Enter a name.");
  if (password && password.length < MIN_PASSWORD_LENGTH) fail(`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (id) {
    const self = id === me.id;
    await db
      .update(adminUsers)
      .set({ name, role: self ? "owner" : role, active: self ? true : active, ...(password ? { passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null } : {}) })
      .where(eq(adminUsers.id, id));
    await logAudit(me.username, "update", "user", id, `${role}${password ? " · password reset" : ""}`);
  } else {
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) fail("Username: 3–32 letters, numbers, dots or dashes.");
    if (!password) fail("Set a password for the new user.");
    const [u] = await db.insert(adminUsers).values({ username, name, role, active, passwordHash: hashPassword(password) }).onConflictDoNothing().returning();
    if (!u) fail("That username is taken.");
    await logAudit(me.username, "create", "user", u.id, `${username} · ${role}`);
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}

export async function resetUserTotp(fd: FormData) {
  const me = await guard("owner");
  const id = int(fd, "id")!;
  await db.update(adminUsers).set({ totpEnabled: false, totpSecret: null }).where(eq(adminUsers.id, id));
  await logAudit(me.username, "reset-2fa", "user", id);
  redirect("/admin/users?saved=1");
}

export async function changeMyPassword(fd: FormData) {
  const me = await guard();
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1);
  const next = String(fd.get("newPassword") ?? "");
  const fail = (m: string) => redirect(`/admin/account?error=${encodeURIComponent(m)}`);
  if (!passwordMatches(String(fd.get("currentPassword") ?? ""), u.passwordHash)) fail("Current password is wrong.");
  if (next.length < MIN_PASSWORD_LENGTH) fail(`New password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
  const passwordHash = hashPassword(next);
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, me.id));
  await createSession({ id: me.id, passwordHash });
  await logAudit(me.username, "change-password", "user", me.id);
  redirect("/admin/account?saved=1");
}

export async function startTotp() {
  const me = await guard();
  await db.update(adminUsers).set({ totpSecret: newTotpSecret(), totpEnabled: false }).where(eq(adminUsers.id, me.id));
  redirect("/admin/account");
}

export async function confirmTotp(fd: FormData) {
  const me = await guard();
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1);
  if (!u.totpSecret || !verifyTotp(u.totpSecret, str(fd, "code"))) redirect("/admin/account?error=That code did not match. Check your phone's clock and try again.");
  await db.update(adminUsers).set({ totpEnabled: true }).where(eq(adminUsers.id, me.id));
  await logAudit(me.username, "enable-2fa", "user", me.id);
  redirect("/admin/account?saved=1");
}

export async function disableTotp(fd: FormData) {
  const me = await guard();
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1);
  if (!u.totpSecret || !verifyTotp(u.totpSecret, str(fd, "code"))) redirect("/admin/account?error=That code did not match.");
  await db.update(adminUsers).set({ totpEnabled: false, totpSecret: null }).where(eq(adminUsers.id, me.id));
  await logAudit(me.username, "disable-2fa", "user", me.id);
  redirect("/admin/account?saved=1");
}
