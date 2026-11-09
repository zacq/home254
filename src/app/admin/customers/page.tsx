import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { customers, orders, pointsLedger } from "@/db/schema";
import { hoursAgo, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { TIER_LABEL, TIERS, isTier } from "@/lib/rewards";

const SEGMENTS = [
  ["members", "Rewards members"],
  ["guests", "Not joined yet"],
  ["lapsed", "Lapsed (no order in 6 months)"],
  ["consent", "Opted in to marketing"],
] as const;

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; tier?: string; segment?: string; category?: string }> }) {
  await guard("sales");
  const sp = await searchParams;
  const [rows, spend, pts, cats] = await Promise.all([
    db.select().from(customers).orderBy(desc(customers.createdAt)).limit(2000),
    db
      .select({ id: orders.customerId, total: sql<number>`coalesce(sum(${orders.total}),0)::int`, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.status} not in ('cancelled','refunded')`)
      .groupBy(orders.customerId),
    db.select({ id: pointsLedger.customerId, available: sql<number>`coalesce(sum(${pointsLedger.points}),0)::int` }).from(pointsLedger).where(eq(pointsLedger.status, "available")).groupBy(pointsLedger.customerId),
    sp.category
      ? db.execute<{ customer_id: number }>(sql`select distinct o.customer_id from orders o join order_items i on i.order_id = o.id where i.category = ${sp.category}`)
      : Promise.resolve(null),
  ]);
  const spendBy = new Map(spend.map((s) => [s.id, s]));
  const ptsBy = new Map(pts.map((p) => [p.id, p.available]));
  const catIds = cats ? new Set(cats.rows.map((r) => r.customer_id)) : null;
  const sixMonths = hoursAgo(182 * 24).getTime();
  const q = sp.q?.replace(/\s/g, "").toLowerCase();
  const list = rows.filter((c) => {
    if (q && !`${c.phone} ${c.name ?? ""} ${c.email ?? ""}`.toLowerCase().replace(/\s/g, "").includes(q.replace(/^0/, ""))) return false;
    if (sp.tier && c.tier !== sp.tier) return false;
    if (catIds && !catIds.has(c.id)) return false;
    switch (sp.segment) {
      case "members":
        return !!c.joinedAt;
      case "guests":
        return !c.joinedAt;
      case "lapsed":
        return !!c.lastPurchaseAt && c.lastPurchaseAt.getTime() < sixMonths;
      case "consent":
        return c.marketingConsent;
      default:
        return true;
    }
  });
  const chip = (on: boolean) => `shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${on ? "bg-brand text-white" : "bg-white"}`;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark">Customers</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/api/admin/export/customers" className="btn btn-outline ml-auto">Export CSV</a>
      </div>
      <form method="get" className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Phone, name or email" className="input !w-auto flex-1" />
        <select name="tier" defaultValue={sp.tier ?? ""} className="input !w-auto" aria-label="Tier">
          <option value="">All tiers</option>
          {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
        </select>
        <input name="category" defaultValue={sp.category} placeholder="Bought category, e.g. tvs" className="input !w-auto" aria-label="Category bought" />
        {sp.segment && <input type="hidden" name="segment" value={sp.segment} />}
        <button className="btn btn-brand">Filter</button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/customers" className={chip(!sp.segment)}>All</Link>
        {SEGMENTS.map(([k, l]) => <Link key={k} href={`/admin/customers?segment=${k}`} className={chip(sp.segment === k)}>{l}</Link>)}
      </div>
      <p className="text-sm text-slate-600">{list.length} customer{list.length === 1 ? "" : "s"}</p>
      <ul className="grid gap-2">
        {list.slice(0, 300).map((c) => {
          const s = spendBy.get(c.id);
          return (
            <li key={c.id}>
              <Link href={`/admin/customers/${c.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span>
                  <b>{c.name || "—"}</b> · +{c.phone}
                  <span className="block text-xs text-slate-500">{c.joinedAt ? `Member since ${c.joinedAt.toLocaleDateString("en-KE")}` : "Not joined"} · {c.marketingConsent ? "marketing opt-in" : "no marketing"}</span>
                </span>
                <span className="text-right">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{isTier(c.tier) ? TIER_LABEL[c.tier] : c.tier}</span>
                  <span className="block text-xs text-slate-600">{s ? `${s.n} orders · ${ksh(s.total)}` : "No orders"} · {(ptsBy.get(c.id) ?? 0).toLocaleString()} pts</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
