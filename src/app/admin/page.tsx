import { and, count, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { events, leads, notifications, orders, products, reviews } from "@/db/schema";
import { hoursAgo, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { customerMessage, PAID_STATUSES } from "@/lib/orders";
import { priceCheck } from "@/lib/pricing";
import { getCategoryTree } from "@/lib/queries";
import { ensureSeed } from "@/lib/seed";
import { getSettings, SETTING_DEFAULTS, waLink } from "@/lib/settings";

const PLACEHOLDERS: [keyof typeof SETTING_DEFAULTS, string][] = [
  ["tillNumber", "M-Pesa Till number"],
  ["whatsapp", "WhatsApp number"],
  ["phoneTel", "Phone number"],
  ["email", "Email address"],
  ["showroomAddress", "Showroom address"],
];

function LowStock({ rows }: { rows: { id: number; name: string; stockQty: number }[] }) {
  return (
    <section className="card p-4">
      <h2 className="font-bold">Low or out of stock</h2>
      <ul className="mt-3 divide-y text-sm">
        {rows.length === 0 && <li className="py-2 text-slate-500">All stocked.</li>}
        {rows.map((p) => (
          <li key={p.id} className="flex justify-between gap-2 py-2">
            <Link className="underline" href={`/admin/products/${p.id}`}>{p.name}</Link>
            <b className={p.stockQty === 0 ? "text-red-700" : "text-amber-700"}>{p.stockQty}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await guard();
  await ensureSeed();
  const sp = await searchParams;
  const lowStock = await db.select().from(products).where(and(eq(products.archived, false), sql`${products.stockQty} <= ${products.lowStockAt}`)).limit(10);
  const denied = sp.denied && <p role="alert" className="rounded-lg bg-amber-50 p-3 font-semibold text-amber-900">Your role does not include that page.</p>;

  const [samples] = await db.select({ n: count() }).from(products).where(and(eq(products.isSample, true), eq(products.archived, false)));
  const sampleNote = samples.n > 0 && (
    <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      <b>{samples.n} sample products</b> are live for review. Replace them with the real catalogue before launch. <Link className="font-semibold underline" href="/admin/products">Products</Link>
    </p>
  );

  if (admin.role === "content" || admin.role === "pricing") {
    const tree = await getCategoryTree(true);
    const floors = new Map(tree.map((c) => [c.slug, c.marginFloorPct]));
    const live = await db.select().from(products).where(eq(products.archived, false));
    const review = live.filter((p) => priceCheck(p, floors.get(p.category)).needsReview).length;
    return (
      <div className="grid gap-5">
        <h1 className="text-2xl font-extrabold text-brand-dark">Dashboard</h1>
        {denied}
        {sampleNote}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
          {admin.role === "pricing" ? (
            <Link href="/admin/pricing" className="btn btn-outline">Weekly price review ({review})</Link>
          ) : (
            <Link href="/admin/content" className="btn btn-outline">Edit site content</Link>
          )}
        </div>
        <LowStock rows={lowStock} />
      </div>
    );
  }

  const since = hoursAgo(24 * 30);
  const reminderDue = hoursAgo(2);
  const [s, [newOrders], [awaiting], [toDeliver], [newLeads], [priceMatch], [queue], [rev], evs, outbox, unpaid] = await Promise.all([
    getSettings(),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "new")),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "awaiting_payment")),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ["confirmed", "scheduled", "dispatched"])),
    db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ n: count() }).from(leads).where(and(eq(leads.status, "new"), eq(leads.type, "price_match"))),
    db.select({ n: count() }).from(reviews).where(eq(reviews.published, false)),
    db.select({ t: sql<number>`coalesce(sum(${orders.total}),0)::int` }).from(orders).where(and(gte(orders.createdAt, since), inArray(orders.status, PAID_STATUSES))),
    db.select({ name: events.name, n: count() }).from(events).where(gte(events.createdAt, since)).groupBy(events.name),
    db.select().from(notifications).where(ne(notifications.channel, "sms")).orderBy(desc(notifications.createdAt)).limit(12),
    db.select().from(orders).where(and(eq(orders.status, "awaiting_payment"), lt(orders.createdAt, reminderDue))).orderBy(desc(orders.createdAt)).limit(10),
  ]);
  const ev = Object.fromEntries(evs.map((e) => [e.name, e.n]));
  const stats: [string, string | number, string][] = [
    ["New orders", newOrders.n, "/admin/orders?status=new"],
    ["Awaiting payment", awaiting.n, "/admin/orders?status=awaiting_payment"],
    ["To deliver", toDeliver.n, "/admin/orders?status=confirmed"],
    ["New leads", newLeads.n, "/admin/leads?status=new"],
    ["Price-match requests", priceMatch.n, "/admin/leads?type=price_match"],
    ["Reviews to approve", queue.n, "/admin/reviews"],
    ["Paid revenue (30d)", ksh(rev.t), "/admin/orders"],
    ["Rewards sign-ups (30d)", ev.rewards_signup ?? 0, "/admin/customers?segment=members"],
    ["WhatsApp clicks (30d)", ev.whatsapp_click ?? 0, "#"],
  ];
  const missing = PLACEHOLDERS.filter(([k]) => s[k] === SETTING_DEFAULTS[k]);
  if (admin.role === "fulfilment") {
    return (
      <div className="grid gap-5">
        <h1 className="text-2xl font-extrabold text-brand-dark">Dashboard</h1>
        {denied}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders?status=confirmed" className="btn btn-primary">Paid, to book ({toDeliver.n} in progress)</Link>
          <Link href="/admin/orders?status=dispatched" className="btn btn-outline">Out for delivery</Link>
          <Link href="/admin/messages" className="btn btn-outline">Messages to send</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold text-brand-dark">Dashboard</h1>
      {denied}
      {sampleNote}
      {missing.length > 0 && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <b>Before launch:</b> these are still placeholders: {missing.map(([, l]) => l).join(", ")}.{" "}
          {admin.role === "owner" && <Link className="font-semibold underline" href="/admin/settings">Update settings</Link>}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(([l, v, h]) => (
          <Link key={l} href={h} className="card p-4">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="text-2xl font-extrabold text-brand-dark">{v}</p>
          </Link>
        ))}
      </div>
      {unpaid.length > 0 && (
        <section className="card p-4">
          <h2 className="font-bold">Unpaid for over 2 hours</h2>
          <ul className="mt-2 divide-y text-sm">
            {unpaid.map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2">
                <Link className="underline" href={`/admin/orders/${o.id}`}>{o.orderNumber} · {o.customerName} · {ksh(o.total)}</Link>
                <a className="font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(o.phone, customerMessage("awaiting_payment", o, { till: s.tillNumber }))}>Send reminder</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-bold">Alerts & customer messages</h2>
          <p className="text-xs text-slate-500">Every order, lead and status change queues a message. Tap “Send” to open WhatsApp with the text ready.</p>
          <ul className="mt-3 divide-y text-sm">
            {outbox.length === 0 && <li className="py-2 text-slate-500">Nothing yet.</li>}
            {outbox.map((n) => (
              <li key={n.id} className="py-2">
                <p className="font-semibold">{n.audience === "admin" ? "🔔" : "✉️"} {n.subject}</p>
                <p className="text-slate-600">{n.message}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  {n.audience === "customer" && n.recipient && (
                    <a className="font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(n.recipient, n.message)}>Send on WhatsApp</a>
                  )}
                  {n.refType === "order" && <Link className="underline" href={`/admin/orders/${n.refId}`}>Open order</Link>}
                  {n.refType === "lead" && <Link className="underline" href="/admin/leads">Open leads</Link>}
                  <span className="text-slate-400">{n.createdAt.toLocaleString("en-KE")}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="grid h-fit gap-4">
          <LowStock rows={lowStock} />
          <div className="flex flex-wrap gap-2">
            {admin.role === "owner" && <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>}
            <Link href="/admin/orders/new" className="btn btn-outline">+ Create order (WhatsApp/phone)</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
