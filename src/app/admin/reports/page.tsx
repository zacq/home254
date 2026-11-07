import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { events, leads, orderItems, orders } from "@/db/schema";
import { hoursAgo, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";

const PERIODS = [7, 30, 90];

function Table({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <section className="card overflow-x-auto p-4">
      <h2 className="font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing in this period.</p>
      ) : (
        <table className="mt-2 w-full text-left text-sm">
          <thead><tr className="border-b text-slate-600">{head.map((h, i) => <th key={h} className={`py-1.5 ${i ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n} className="border-b border-slate-100">
                {r.map((c, i) => <td key={i} className={`py-1.5 ${i ? "text-right" : ""}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await guard("owner");
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const since = hoursAgo(days * 24);
  const paid = sql`${orders.status} in ('confirmed','scheduled','delivered')`;
  const total = sql<number>`coalesce(sum(${orders.total}),0)::int`;

  const [[summary], channels, top, leadTypes, leadSources, clicks] = await Promise.all([
    db.select({ n: count(), revenue: total }).from(orders).where(and(gte(orders.createdAt, since), paid)),
    db.select({ source: orders.source, n: count(), revenue: total }).from(orders).where(and(gte(orders.createdAt, since), paid)).groupBy(orders.source).orderBy(desc(count())),
    db
      .select({ name: orderItems.name, model: orderItems.modelNumber, qty: sql<number>`sum(${orderItems.qty})::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(gte(orders.createdAt, since), paid))
      .groupBy(orderItems.name, orderItems.modelNumber)
      .orderBy(desc(sql`sum(${orderItems.qty})`))
      .limit(10),
    db.select({ type: leads.type, n: count() }).from(leads).where(gte(leads.createdAt, since)).groupBy(leads.type).orderBy(desc(count())),
    db.select({ page: leads.sourcePage, n: count() }).from(leads).where(gte(leads.createdAt, since)).groupBy(leads.sourcePage).orderBy(desc(count())).limit(10),
    db.select({ name: events.name, n: count() }).from(events).where(gte(events.createdAt, since)).groupBy(events.name).orderBy(desc(count())),
  ]);

  const stats: [string, string | number][] = [
    ["Paid orders", summary.n],
    ["Revenue", ksh(summary.revenue)],
    ["Average order", summary.n ? ksh(summary.revenue / summary.n) : "—"],
    ["Leads", leadTypes.reduce((n, l) => n + l.n, 0)],
  ];

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Reports</h1>
      <div className="flex gap-2">
        {PERIODS.map((d) => (
          <Link key={d} href={`/admin/reports?days=${d}`} className={`rounded-full px-3 py-2 text-sm font-semibold ${d === days ? "bg-brand text-white" : "bg-white"}`}>Last {d} days</Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="text-2xl font-extrabold text-brand-dark">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="Orders by channel" head={["Channel", "Orders", "Revenue"]} rows={channels.map((c) => [c.source, c.n, ksh(c.revenue)])} />
        <Table title="Top products" head={["Product", "Units"]} rows={top.map((t) => [`${t.name} (${t.model})`, t.qty])} />
        <Table title="Leads by type" head={["Type", "Leads"]} rows={leadTypes.map((l) => [l.type, l.n])} />
        <Table title="Leads by source page" head={["Page", "Leads"]} rows={leadSources.map((l) => [l.page ?? "n/a", l.n])} />
        <Table title="Tracked actions" head={["Event", "Count"]} rows={clicks.map((c) => [c.name, c.n])} />
      </div>
    </div>
  );
}
