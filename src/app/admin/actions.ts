"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers, content, deliveryZones, leads, notifications, orderItems, orders, products, reviews, settings } from "@/db/schema";
import { authenticate, createSession, destroySession, hashPassword, MIN_PASSWORD_LENGTH, passwordMatches, ROLES, type Role } from "@/lib/auth";
import { isBlockKey, sanitizeBlock } from "@/lib/content-schema";
import { parseCsv, productFieldsFromCsv } from "@/lib/csv";
import { CATEGORY_LABEL, slugify } from "@/lib/format";
import { guard } from "@/lib/guard";
import { createOrder, customerMessage, logAudit, statusLabel } from "@/lib/orders";
import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";
import { newTotpSecret, verifyTotp } from "@/lib/totp";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};
const date = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v ? new Date(v) : null;
};
// An offer stays live through its last day in Nairobi time.
const endOfDay = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v ? new Date(`${v}T23:59:59+03:00`) : null;
};
const isDead = (status: string) => status === "cancelled" || status === "refunded";

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

export async function saveProduct(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id");
  const name = str(fd, "name");
  const model = str(fd, "modelNumber");
  const slug = slugify(str(fd, "slug") || `${name}-${model}`);
  const data = {
    name,
    brand: str(fd, "brand") || "MIKA",
    modelNumber: model,
    slug,
    category: str(fd, "category"),
    type: str(fd, "type"),
    washCapacityKg: int(fd, "washCapacityKg"),
    dryCapacityKg: int(fd, "dryCapacityKg"),
    spinRpm: int(fd, "spinRpm"),
    energyRating: str(fd, "energyRating") || null,
    motor: str(fd, "motor") || "Standard",
    features: fd.getAll("features").map(String),
    warranty: str(fd, "warranty") || "2-year general warranty",
    priceKsh: int(fd, "priceKsh") ?? 0,
    offerPriceKsh: int(fd, "offerPriceKsh"),
    offerStart: date(fd, "offerStart"),
    offerEnd: endOfDay(fd, "offerEnd"),
    offerBadge: str(fd, "offerBadge") || null,
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
  };
  if (!name || !model || !data.category || data.priceKsh <= 0) redirect(`/admin/products/${id ?? "new"}?error=Name, model, category and price are required`);
  try {
    if (id) {
      await db.update(products).set(data).where(eq(products.id, id));
      await logAudit(actor.username, "update", "product", id, `${name} · price ${data.priceKsh} · stock ${data.stockQty}`);
    } else {
      const [p] = await db.insert(products).values(data).returning();
      await logAudit(actor.username, "create", "product", p.id, name);
    }
  } catch {
    redirect(`/admin/products/${id ?? "new"}?error=Model number or URL slug already exists`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function quickUpdateProduct(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id")!;
  const price = int(fd, "priceKsh") ?? 0;
  if (price <= 0) return;
  const offer = int(fd, "offerPriceKsh");
  const [current] = await db.select({ offerStart: products.offerStart }).from(products).where(eq(products.id, id)).limit(1);
  const set = {
    priceKsh: price,
    offerPriceKsh: offer,
    offerEnd: endOfDay(fd, "offerEnd"),
    offerStart: offer ? (current?.offerStart ?? new Date()) : null,
    stockQty: int(fd, "stockQty") ?? 0,
  };
  await db.update(products).set(set).where(eq(products.id, id));
  await logAudit(actor.username, "quick-update", "product", id, `price ${price}, offer ${offer ?? "none"}, stock ${set.stockQty}`);
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

export async function importProducts(fd: FormData) {
  const actor = await guard("content");
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
    if (fields.category && !CATEGORY_LABEL[fields.category]) {
      problems.push(`Row ${line}: unknown category "${fields.category}"`);
      continue;
    }
    if (r.slug) fields.slug = slugify(r.slug);
    try {
      const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.modelNumber, model)).limit(1);
      if (existing) {
        if (Object.keys(fields).length) await db.update(products).set(fields).where(eq(products.id, existing.id));
        updated++;
      } else if (!fields.name || !fields.category || !fields.priceKsh) {
        problems.push(`Row ${line}: new product needs name, category and priceKsh`);
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

export async function updateOrderStatus(fd: FormData) {
  const actor = await guard("sales");
  const id = int(fd, "id")!;
  const status = str(fd, "status");
  const code = str(fd, "mpesaCode").toUpperCase();
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return;
  const set: Partial<typeof orders.$inferInsert> = { status };
  if (code) set.mpesaCode = code;
  const deliveryDate = str(fd, "deliveryDate");
  if (deliveryDate) set.deliveryDate = deliveryDate;
  await db.update(orders).set(set).where(eq(orders.id, id));
  if (isDead(status) !== isDead(o.status)) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    for (const i of items) {
      if (!i.productId) continue;
      const delta = isDead(status) ? i.qty : -i.qty;
      await db.update(products).set({ stockQty: sql`greatest(${products.stockQty} + ${delta}, 0)` }).where(eq(products.id, i.productId));
    }
    revalidatePath("/", "layout");
  }
  if (status !== o.status) {
    const s = await getSettings();
    await db.insert(notifications).values({
      audience: "customer",
      recipient: o.phone,
      subject: `${o.orderNumber}: ${statusLabel(status)}`,
      message: customerMessage(status, { ...o, deliveryDate: deliveryDate || o.deliveryDate }, s.tillNumber),
      refType: "order",
      refId: o.id,
    });
  }
  await logAudit(actor.username, "status", "order", id, `${o.status} → ${status}${code ? ` · M-Pesa ${code}` : ""}`);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function createManualOrder(fd: FormData) {
  const actor = await guard("sales");
  const lines = fd
    .getAll("productId")
    .map((v, i) => ({ productId: Number(v), qty: Number(fd.getAll("qty")[i]) || 1 }))
    .filter((l) => l.productId > 0);
  const res = await createOrder({
    name: str(fd, "name"),
    phone: str(fd, "phone"),
    zoneId: int(fd, "zoneId") ?? 0,
    address: str(fd, "address"),
    installation: fd.get("installation") === "on",
    paymentMethod: str(fd, "paymentMethod") === "pod" ? "pod" : "mpesa",
    source: str(fd, "source") || "whatsapp",
    notes: str(fd, "notes"),
    lines,
  });
  if (!res.ok) redirect(`/admin/orders/new?error=${encodeURIComponent(res.error)}`);
  const [o] = await db.select().from(orders).where(eq(orders.token, res.token)).limit(1);
  await logAudit(actor.username, "create", "order", o.id, `${res.orderNumber} (manual, ${o.source})`);
  redirect(`/admin/orders/${o.id}`);
}

export async function updateLead(fd: FormData) {
  const actor = await guard("sales");
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

export async function saveZone(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    fee: int(fd, "fee") ?? 0,
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

export async function saveReview(fd: FormData) {
  const actor = await guard("content");
  const id = int(fd, "id");
  const data = {
    name: str(fd, "name"),
    location: str(fd, "location") || null,
    rating: Math.min(5, Math.max(1, int(fd, "rating") ?? 5)),
    body: str(fd, "body"),
    imageUrl: str(fd, "imageUrl") || null,
    productId: int(fd, "productId"),
    published: fd.get("published") === "on",
  };
  if (!data.name || !data.body) return;
  if (id) await db.update(reviews).set(data).where(eq(reviews.id, id));
  else await db.insert(reviews).values(data);
  await logAudit(actor.username, id ? "update" : "create", "review", id ?? undefined, data.name);
  revalidatePath("/", "layout");
  revalidatePath("/admin/reviews");
}

export async function deleteReview(fd: FormData) {
  const actor = await guard("content");
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
  await logAudit(actor.username, "update", "settings");
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

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
