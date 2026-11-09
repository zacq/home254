import { and, desc, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, pointsLedger, rewardCampaigns, type RewardCampaign } from "@/db/schema";
import { CATALOG } from "@/lib/catalog";
import { hoursAgo, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { PAID_STATUSES } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { saveCampaign, saveSettings } from "../actions";

const RULES: [string, string, string?][] = [
  ["rewardsName", "Programme name"],
  ["earnBronze", "Bronze: points per KSh 100"],
  ["earnSilver", "Silver: points per KSh 100"],
  ["earnGold", "Gold: points per KSh 100"],
  ["earnPlatinum", "Platinum: points per KSh 100"],
  ["tierSilver", "Silver from (12-month spend, KSh)"],
  ["tierGold", "Gold from (KSh)"],
  ["tierPlatinum", "Platinum from (KSh)"],
  ["signupBonus", "Join bonus (points)"],
  ["warrantyBonus", "Warranty registration bonus (points)"],
  ["crossSellBonus", "Matched add-on bonus (points)", "Set to 0 to switch off cart add-on nudges"],
  ["redeemMin", "Minimum balance to redeem (points)"],
  ["redeemCapPct", "Redemption cap (% of product value)"],
  ["expiryMonths", "Points expire after (months without a purchase)"],
];

const local = (d: Date) => new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);

function CampaignForm({ c }: { c?: RewardCampaign }) {
  return (
    <form action={saveCampaign} className="card grid gap-2 p-3 sm:grid-cols-3 sm:items-end">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div><label className="label">Name</label><input name="name" required defaultValue={c?.name} placeholder="e.g. Double points weekend" className="input" /></div>
      <div>
        <label className="label">Multiplier</label>
        <select name="multiplier" defaultValue={c?.multiplier ?? 2} className="input"><option value={2}>2× points</option><option value={3}>3× points</option></select>
      </div>
      <div>
        <label className="label">Applies to</label>
        <select name="scope" defaultValue={c?.scope ?? "all"} className="input">
          <option value="all">Everything</option>
          <option value="category">A category</option>
          <option value="brand">A brand</option>
          <option value="product">One product (ID)</option>
        </select>
      </div>
      <div>
        <label className="label">Category slug, brand or product ID</label>
        <input name="scopeValue" list="campaign-cats" defaultValue={c?.scopeValue ?? ""} className="input" />
      </div>
      <div><label className="label">Starts</label><input name="startsAt" type="date" required defaultValue={c ? local(c.startsAt) : ""} className="input" /></div>
      <div><label className="label">Ends (end of day)</label><input name="endsAt" type="date" required defaultValue={c ? local(c.endsAt) : ""} className="input" /></div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c ? c.active : true} className="h-5 w-5" /> Active</label>
        <button className="btn btn-brand ml-auto">{c ? "Save" : "Create campaign"}</button>
      </div>
    </form>
  );
}

export default async function AdminRewards({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guard("owner");
  const sp = await searchParams;
  const since = hoursAgo(24 * 90);
  const [s, campaigns, [ledger], [rev], [members], byType] = await Promise.all([
    getSettings(),
    db.select().from(rewardCampaigns).orderBy(desc(rewardCampaigns.endsAt)),
    db
      .select({
        available: sql<number>`coalesce(sum(case when ${pointsLedger.status} = 'available' then ${pointsLedger.points} end),0)::int`,
        pending: sql<number>`coalesce(sum(case when ${pointsLedger.status} = 'pending' then ${pointsLedger.points} end),0)::int`,
      })
      .from(pointsLedger),
    db.select({ t: sql<number>`coalesce(sum(${orders.subtotal}),0)::int` }).from(orders).where(and(gte(orders.createdAt, since), inArray(orders.status, PAID_STATUSES))),
    db.select({ n: sql<number>`count(*)::int` }).from(customers).where(isNotNull(customers.joinedAt)),
    db
      .select({ type: pointsLedger.type, total: sql<number>`coalesce(sum(${pointsLedger.points}),0)::int` })
      .from(pointsLedger)
      .where(and(gte(pointsLedger.createdAt, since), inArray(pointsLedger.status, ["available", "pending"])))
      .groupBy(pointsLedger.type),
  ]);
  const t = (k: string) => byType.find((x) => x.type === k)?.total ?? 0;
  const issued = t("earn") + t("bonus") + Math.max(0, t("adjust"));
  const redeemed = -t("redeem");
  const cost = rev.t ? ((issued / rev.t) * 100).toFixed(2) : "0";
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold text-brand-dark">Rewards</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <section aria-labelledby="liab-h">
        <h2 id="liab-h" className="mb-2 font-bold">Programme cost (last 90 days)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Members", members.n.toLocaleString()],
            ["Points issued", issued.toLocaleString()],
            ["Points redeemed", redeemed.toLocaleString()],
            ["Redemption rate", issued ? `${Math.round((redeemed / issued) * 100)}%` : "—"],
            ["Outstanding liability", ksh(ledger.available + ledger.pending)],
            ["Cost % of revenue", `${cost}%`],
          ].map(([l, v]) => (
            <div key={l} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className="text-xl font-extrabold text-brand-dark">{v}</p></div>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">Liability = available ({ledger.available.toLocaleString()}) + pending ({ledger.pending.toLocaleString()}) points at KSh 1 each. Target: cost under 1.5% of revenue; redemption 30–50%.</p>
      </section>
      <form action={saveSettings} className="card grid gap-3 p-4 sm:grid-cols-2">
        <input type="hidden" name="returnTo" value="/admin/rewards" />
        <h2 className="font-bold sm:col-span-2">Earn, tier and redemption rules</h2>
        {RULES.map(([k, l, h]) => (
          <div key={k}>
            <label className="label" htmlFor={k}>{l}</label>
            <input id={k} name={k} defaultValue={s[k as keyof typeof s]} className="input" />
            {h && <p className="text-xs text-slate-500">{h}</p>}
          </div>
        ))}
        <button className="btn btn-primary w-fit sm:col-span-2">Save rules</button>
      </form>
      <section className="grid gap-3">
        <h2 className="font-bold">Double and triple points campaigns</h2>
        <datalist id="campaign-cats">{CATALOG.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</datalist>
        <CampaignForm />
        {campaigns.map((c) => <CampaignForm key={c.id} c={c} />)}
      </section>
      <p className="text-xs text-slate-500">Manual point adjustments are made on each customer&apos;s page and need a reason. Referral, review and birthday bonuses are planned for Phase 2.</p>
    </div>
  );
}
