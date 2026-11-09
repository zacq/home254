import { and, eq, gte, lte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { customers, orders, pointsLedger, rewardCampaigns, type Customer, type Product, type RewardCampaign } from "@/db/schema";
import { getSettings, type Settings } from "@/lib/settings";

export const TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type Tier = (typeof TIERS)[number];
export const TIER_LABEL: Record<Tier, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };
export const TIER_BENEFITS: Record<Tier, string> = {
  bronze: "Sign-up bonus, birthday points and member deal alerts",
  silver: "Everything in Bronze, plus members-only prices on selected items",
  gold: "Free delivery in Zones 1–2 and early access to flash sales",
  platinum: "Free delivery in all zones, priority installation and a dedicated WhatsApp line",
};
export const TIER_NUDGE: Record<Tier, string> = {
  bronze: "",
  silver: "unlock members-only prices",
  gold: "get free delivery",
  platinum: "get free delivery everywhere and priority installation",
};
export const isTier = (t: string): t is Tier => (TIERS as readonly string[]).includes(t);

const n = (v: string, d: number) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? x : d;
};

export function rewardsConfig(s: Settings) {
  return {
    name: s.rewardsName,
    rate: { bronze: n(s.earnBronze, 1), silver: n(s.earnSilver, 1.25), gold: n(s.earnGold, 1.5), platinum: n(s.earnPlatinum, 2) } as Record<Tier, number>,
    threshold: { bronze: 0, silver: n(s.tierSilver, 100000), gold: n(s.tierGold, 250000), platinum: n(s.tierPlatinum, 500000) } as Record<Tier, number>,
    signupBonus: n(s.signupBonus, 200),
    warrantyBonus: n(s.warrantyBonus, 100),
    crossSellBonus: n(s.crossSellBonus, 150),
    redeemMin: n(s.redeemMin, 200),
    redeemCapPct: n(s.redeemCapPct, 10),
    expiryMonths: n(s.expiryMonths, 12),
  };
}
export type RewardsConfig = ReturnType<typeof rewardsConfig>;

export const getRewardsConfig = cache(async () => rewardsConfig(await getSettings()));

// 1 point per KSh 100 of product value at the base rate, rounded down (RW-1).
export const earnPoints = (price: number, rate: number, mult = 1) => Math.floor((price / 100) * rate * mult);

export function tierForSpend(spend: number, cfg: RewardsConfig): Tier {
  return [...TIERS].reverse().find((t) => spend >= cfg.threshold[t]) ?? "bronze";
}
export const nextTier = (t: Tier): Tier | null => TIERS[TIERS.indexOf(t) + 1] ?? null;
const higher = (a: Tier, b: Tier) => (TIERS.indexOf(a) >= TIERS.indexOf(b) ? a : b);

export const activeCampaigns = cache(async (): Promise<RewardCampaign[]> => {
  const now = new Date();
  try {
    return await db.select().from(rewardCampaigns).where(and(eq(rewardCampaigns.active, true), lte(rewardCampaigns.startsAt, now), gte(rewardCampaigns.endsAt, now)));
  } catch {
    return [];
  }
});

export function campaignMultiplier(p: Pick<Product, "id" | "category" | "brand">, list: RewardCampaign[]) {
  let m = 1;
  for (const c of list) {
    const hit =
      c.scope === "all" ||
      (c.scope === "category" && c.scopeValue === p.category) ||
      (c.scope === "brand" && c.scopeValue?.toLowerCase() === p.brand.toLowerCase()) ||
      (c.scope === "product" && Number(c.scopeValue) === p.id);
    if (hit) m = Math.max(m, c.multiplier);
  }
  return m;
}

export async function balances(customerId: number) {
  const rows = await db
    .select({ status: pointsLedger.status, total: sql<number>`coalesce(sum(${pointsLedger.points}),0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.customerId, customerId))
    .groupBy(pointsLedger.status);
  const get = (s: string) => rows.find((r) => r.status === s)?.total ?? 0;
  return { available: Math.max(0, get("available")), pending: Math.max(0, get("pending")) };
}

// Product value of delivered orders in the last 12 months.
export async function spend12m(customerId: number) {
  const since = new Date(Date.now() - 365 * 86_400_000);
  const [r] = await db
    .select({ t: sql<number>`coalesce(sum(${orders.subtotal}),0)::int` })
    .from(orders)
    .where(and(eq(orders.customerId, customerId), eq(orders.status, "delivered"), gte(orders.createdAt, since)));
  return r.t;
}

// Tiers only go up between annual reviews (RW-4); a big purchase can jump a tier at once (RW-5).
export async function refreshTier(c: Customer, cfg: RewardsConfig): Promise<{ tier: Tier; spend: number; upgraded: boolean }> {
  const spend = await spend12m(c.id);
  const stored = isTier(c.tier) ? c.tier : "bronze";
  const tier = higher(stored, tierForSpend(spend, cfg));
  if (tier !== stored) await db.update(customers).set({ tier }).where(eq(customers.id, c.id));
  return { tier, spend, upgraded: tier !== stored };
}

export function expiryDate(c: Customer, cfg: RewardsConfig) {
  const base = c.lastPurchaseAt ?? c.joinedAt ?? c.createdAt;
  const d = new Date(base);
  d.setMonth(d.getMonth() + cfg.expiryMonths);
  return d;
}

// Points expire 12 months after the last purchase (RW-8). Applied when the balance is next read.
export async function expireIfDue(c: Customer, cfg: RewardsConfig) {
  if (expiryDate(c, cfg) > new Date()) return;
  const { available } = await balances(c.id);
  if (available > 0) {
    await db.insert(pointsLedger).values({ customerId: c.id, type: "expire", points: -available, status: "available", reason: `No purchase in ${cfg.expiryMonths} months` });
  }
}

export async function addPoints(v: { customerId: number; type: string; points: number; status?: "pending" | "available"; orderId?: number; reason?: string; actor?: string }) {
  if (!v.points) return;
  await db.insert(pointsLedger).values({ status: "available", ...v });
}
