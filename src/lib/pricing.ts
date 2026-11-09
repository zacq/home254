import type { Product } from "@/db/schema";
import { activePrice } from "@/lib/format";

export const STALE_DAYS = 7;

// PRD section 8: price at or just below the competitor reference.
//   over KSh 50,000   → about KSh 2,000 below, ending in …995 or …495
//   KSh 5,000–50,000  → about 3% below, ending in …95
//   under KSh 5,000   → about 4.5% below, ending in 0 or 5
const mod = (a: number, n: number) => ((a % n) + n) % n;
// Largest value ≤ x that ends in `ending` within each block of `step`.
const roundDownTo = (x: number, ending: number, step: number) => x - mod(x - ending, step);

export function suggestedPrice(competitor: number): number {
  if (competitor > 50_000) return roundDownTo(competitor - 2000, 495, 500);
  if (competitor >= 5_000) return roundDownTo(Math.floor(competitor * 0.97), 95, 100);
  return Math.max(5, Math.floor((competitor * 0.955) / 5) * 5);
}

// Lowest price allowed by the category margin floor, or null when cost or floor is unknown.
export function floorPrice(cost: number | null | undefined, floorPct: number | null | undefined) {
  if (!cost || floorPct == null) return null;
  return Math.ceil(cost * (1 + floorPct / 100));
}

export type PriceCheck = {
  suggested: number | null;
  floor: number | null;
  belowFloor: boolean;
  aboveCompetitor: boolean;
  stale: boolean;
  needsReview: boolean;
};

export function priceCheck(p: Product, floorPct: number | null | undefined, now = new Date()): PriceCheck {
  const floor = floorPrice(p.costKsh, floorPct);
  const raw = p.competitorPriceKsh ? suggestedPrice(p.competitorPriceKsh) : null;
  const suggested = raw != null && floor != null ? Math.max(raw, floor) : raw;
  const live = activePrice(p, now).price;
  const stale = !!p.competitorPriceKsh && (!p.competitorCheckedAt || now.getTime() - p.competitorCheckedAt.getTime() > STALE_DAYS * 86_400_000);
  const aboveCompetitor = !!p.competitorPriceKsh && live > p.competitorPriceKsh;
  const belowFloor = floor != null && live < floor;
  return { suggested, floor, belowFloor, aboveCompetitor, stale, needsReview: stale || aboveCompetitor || belowFloor };
}
