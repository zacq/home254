import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pointsLedger, type Customer } from "@/db/schema";
import { ksh } from "@/lib/format";
import { balances, expireIfDue, expiryDate, getRewardsConfig, nextTier, refreshTier, TIER_BENEFITS, TIER_LABEL } from "@/lib/rewards";

const TYPE_LABEL: Record<string, string> = { earn: "Earned", bonus: "Bonus", redeem: "Used", expire: "Expired", reverse: "Reversed", adjust: "Adjustment" };

// Balance, tier, progress to the next tier, points history and expiry (PRD FR-23).
export async function RewardsStatus({ customer }: { customer: Customer }) {
  const cfg = await getRewardsConfig();
  await expireIfDue(customer, cfg);
  const [{ available, pending }, { tier, spend }, history] = await Promise.all([
    balances(customer.id),
    refreshTier(customer, cfg),
    db.select().from(pointsLedger).where(eq(pointsLedger.customerId, customer.id)).orderBy(desc(pointsLedger.createdAt)).limit(30),
  ]);
  const next = nextTier(tier);
  const from = cfg.threshold[tier];
  const to = next ? cfg.threshold[next] : from;
  const pct = next ? Math.min(100, Math.round(((spend - from) / Math.max(1, to - from)) * 100)) : 100;
  const expires = expiryDate(customer, cfg);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Available points</p>
          <p className="text-3xl font-extrabold text-amber-700">{available.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Worth {ksh(available)} at checkout</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Pending (until delivery)</p>
          <p className="text-3xl font-extrabold text-slate-700">{pending.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Tier</p>
          <p className="text-3xl font-extrabold text-brand-dark">{TIER_LABEL[tier]}</p>
          <p className="text-xs text-slate-500">Earning {cfg.rate[tier]} points per KSh 100</p>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>12-month spend: <b>{ksh(spend)}</b></span>
          {next ? <span><b>{ksh(Math.max(0, to - spend))}</b> more to reach {TIER_LABEL[next]}</span> : <span>You are at the top tier.</span>}
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to next tier">
          <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-600">{TIER_BENEFITS[tier]}.{next ? ` ${TIER_LABEL[next]}: ${TIER_BENEFITS[next]}.` : ""}</p>
        {available > 0 && (
          <p className="mt-2 text-xs font-semibold text-red-700">
            {available.toLocaleString()} points expire on {expires.toLocaleDateString("en-KE", { dateStyle: "medium" })} unless you buy something before then.
          </p>
        )}
      </div>
      <div className="card overflow-x-auto p-4">
        <h3 className="font-bold">Points history</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No points yet.</p>
        ) : (
          <table className="mt-2 w-full min-w-[28rem] text-left text-sm">
            <thead><tr className="border-b text-slate-500"><th className="py-1.5">Date</th><th>Activity</th><th>Status</th><th className="text-right">Points</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-slate-100">
                  <td className="py-1.5">{h.createdAt.toLocaleDateString("en-KE")}</td>
                  <td>{TYPE_LABEL[h.type] ?? h.type}{h.reason ? ` · ${h.reason}` : ""}</td>
                  <td className="capitalize">{h.status === "void" ? "cancelled" : h.status}</td>
                  <td className={`text-right font-bold ${h.points < 0 ? "text-red-700" : "text-emerald-700"}`}>{h.points > 0 ? "+" : ""}{h.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
