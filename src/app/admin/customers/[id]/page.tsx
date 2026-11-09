import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { customers, orders, pointsLedger, products, reviews, wishlistItems } from "@/db/schema";
import { ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { statusLabel } from "@/lib/orders";
import { balances, getRewardsConfig, isTier, spend12m, TIER_LABEL } from "@/lib/rewards";
import { waLink } from "@/lib/settings";
import { adjustPoints } from "../../actions";

export default async function AdminCustomer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const admin = await guard("sales");
  const { id } = await params;
  const sp = await searchParams;
  const [c] = await db.select().from(customers).where(eq(customers.id, Number(id))).limit(1);
  if (!c) notFound();
  const [myOrders, ledger, bal, spend, wish, myReviews, cfg] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, c.id)).orderBy(desc(orders.createdAt)),
    db.select().from(pointsLedger).where(eq(pointsLedger.customerId, c.id)).orderBy(desc(pointsLedger.createdAt)).limit(100),
    balances(c.id),
    spend12m(c.id),
    db.select({ id: products.id, name: products.name }).from(wishlistItems).innerJoin(products, eq(products.id, wishlistItems.productId)).where(eq(wishlistItems.customerId, c.id)),
    db.select().from(reviews).where(eq(reviews.customerId, c.id)),
    getRewardsConfig(),
  ]);
  return (
    <div className="grid gap-4">
      <Link href="/admin/customers" className="text-sm font-semibold underline">← Customers</Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark">{c.name || `+${c.phone}`}</h1>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{isTier(c.tier) ? TIER_LABEL[c.tier] : c.tier}</span>
        <a className="btn btn-wa ml-auto" target="_blank" rel="noopener noreferrer" href={waLink(c.phone, `Hi ${c.name?.split(" ")[0] ?? ""},`)}>WhatsApp</a>
      </div>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Available points", bal.available.toLocaleString()],
          ["Pending points", bal.pending.toLocaleString()],
          ["12-month spend", ksh(spend)],
          ["Orders", myOrders.length],
        ].map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className="text-xl font-extrabold text-brand-dark">{v}</p></div>)}
      </div>
      <section className="card p-4 text-sm">
        <p>+{c.phone} · {c.email ?? "no email"} · {c.joinedAt ? `joined ${cfg.name} ${c.joinedAt.toLocaleDateString("en-KE")}` : "has not joined Rewards"}</p>
        <p>Marketing consent: <b>{c.marketingConsent ? "yes" : "no"}</b>{c.birthday ? ` · Birthday ${c.birthday}` : ""}</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-bold">Orders</h2>
          <ul className="mt-2 divide-y text-sm">
            {myOrders.length === 0 && <li className="py-2 text-slate-500">None.</li>}
            {myOrders.map((o) => (
              <li key={o.id} className="flex justify-between gap-2 py-2">
                <Link className="underline" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
                <span>{ksh(o.total)} · {statusLabel(o.status)} · +{o.pointsEarned}{o.pointsRedeemed ? ` / −${o.pointsRedeemed}` : ""} pts</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-4 font-bold">Wishlist</h2>
          <p className="text-sm text-slate-600">{wish.map((w) => w.name).join(", ") || "Empty"}</p>
          <h2 className="mt-4 font-bold">Reviews</h2>
          <p className="text-sm text-slate-600">{myReviews.length ? myReviews.map((r) => `${r.rating}★ “${r.body.slice(0, 60)}”`).join(" · ") : "None"}</p>
        </section>
        <section className="card p-4">
          <h2 className="font-bold">Points ledger</h2>
          {admin.role === "owner" && (
            <form action={adjustPoints} className="mt-2 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
              <input type="hidden" name="customerId" value={c.id} />
              <div><label className="label" htmlFor="points">Points (+/−)</label><input id="points" name="points" type="number" required className="input" /></div>
              <div><label className="label" htmlFor="reason">Reason (required)</label><input id="reason" name="reason" required minLength={3} className="input" /></div>
              <button className="btn btn-brand">Adjust</button>
            </form>
          )}
          <ul className="mt-2 divide-y text-sm">
            {ledger.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 py-1.5">
                <span>{l.createdAt.toLocaleDateString("en-KE")} · {l.type} · {l.status}{l.reason ? ` · ${l.reason}` : ""}{l.actor ? ` (${l.actor})` : ""}</span>
                <b className={l.points < 0 ? "text-red-700" : "text-emerald-700"}>{l.points > 0 ? "+" : ""}{l.points}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
