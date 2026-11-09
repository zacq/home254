import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { RewardsStatus } from "@/components/RewardsStatus";
import { getContent } from "@/lib/content";
import { getCustomer } from "@/lib/customer-auth";
import { activeCampaigns, getRewardsConfig, TIER_BENEFITS, TIER_LABEL, TIERS } from "@/lib/rewards";
import { ksh } from "@/lib/format";

export const metadata = {
  title: "Nyumbani Rewards: Earn Points on Every Appliance",
  description: "Join Nyumbani Rewards free. Earn points on every purchase, climb from Bronze to Platinum, and use points as money off your next order.",
  alternates: { canonical: "/rewards" },
};

export default async function RewardsPage() {
  const [cfg, page, faqs, campaigns, member] = await Promise.all([getRewardsConfig(), getContent("rewardsPage"), getContent("rewardsFaqs"), activeCampaigns(), getCustomer()]);
  return (
    <>
      <PageHeader title={cfg.name} intro={page.intro}>
        {!member && <Link href="/account/sign-in?next=/rewards" className="btn btn-primary mt-4">Join free, get {cfg.signupBonus} points</Link>}
      </PageHeader>
      <div className="container-x grid gap-8 py-6">
        {member && (
          <section aria-labelledby="mine-h">
            <h2 id="mine-h" className="mb-3 text-xl font-extrabold text-brand-dark">Your Rewards</h2>
            <RewardsStatus customer={member} />
          </section>
        )}
        {campaigns.length > 0 && (
          <section className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
            <h2 className="font-extrabold text-red-800">🔥 Bonus points events now on</h2>
            <ul className="mt-2 text-sm">
              {campaigns.map((c) => (
                <li key={c.id}><b>{c.multiplier}× points</b> · {c.name} · until {c.endsAt.toLocaleDateString("en-KE", { dateStyle: "medium" })}</li>
              ))}
            </ul>
          </section>
        )}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">How to earn</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>{cfg.rate.bronze} point for every KSh 100 of product value, more in higher tiers.</li>
              <li>{cfg.signupBonus} points when you join.</li>
              <li>{cfg.warrantyBonus} points when you register a warranty.</li>
              {cfg.crossSellBonus > 0 && <li>{cfg.crossSellBonus} bonus points on matched add-ons, such as a soundbar with a TV.</li>}
              <li>Double or triple points during special events.</li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">How to redeem</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>1 point = KSh 1 off at checkout.</li>
              <li>Use points once you have {cfg.redeemMin} or more.</li>
              <li>Points can pay for up to {cfg.redeemCapPct}% of an order&apos;s product value.</li>
              <li>Combine points with M-Pesa or Pay on Delivery.</li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">Keep your points</h2>
            <p className="mt-2 text-sm text-slate-700">Points stay valid for {cfg.expiryMonths} months after your last purchase. Any purchase keeps your whole balance alive.</p>
          </div>
        </section>
        <section aria-labelledby="tiers-h" className="card overflow-x-auto p-5">
          <h2 id="tiers-h" className="text-xl font-extrabold text-brand-dark">Tiers</h2>
          <table className="mt-3 w-full min-w-[36rem] text-left text-sm">
            <thead><tr className="border-b text-slate-600"><th className="py-2">Tier</th><th>Spend in the last 12 months</th><th>Points per KSh 100</th><th>Benefits</th></tr></thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t} className="border-b border-slate-100">
                  <td className="py-2 font-bold">{TIER_LABEL[t]}</td>
                  <td>{t === "bronze" ? "Join free" : `${ksh(cfg.threshold[t])}+`}</td>
                  <td>{cfg.rate[t]}</td>
                  <td>{TIER_BENEFITS[t]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-extrabold text-brand-dark">Questions</h2>
          <div className="grid gap-2">
            {faqs.map((f) => (
              <details key={f.q} className="card p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="terms" className="card prose-p scroll-mt-32 p-5"><Prose body={page.terms} /></section>
      </div>
    </>
  );
}
