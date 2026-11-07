import { activePrice } from "@/lib/format";
import { allProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Rules-based recommendation: household size, space, drying need, budget, priority.
export async function POST(req: Request) {
  const a = (await req.json().catch(() => ({}))) as Record<string, string>;
  const all = (await allProducts()).filter((p) => ["washers", "combos", "dryers", "entry-washers"].includes(p.category) && p.stockQty > 0);
  const household = a.household ?? "3-4";
  const needDry = a.dry === "yes";
  const budgetMax = ({ low: 45000, mid: 100000, high: 130000, any: 10_000_000 } as Record<string, number>)[a.budget ?? "any"] ?? 10_000_000;
  const minCap = household === "5+" ? 10 : household === "3-4" ? 8 : 0;

  const scored = all
    .filter((p) => (needDry ? p.category === "combos" : p.category !== "dryers"))
    .map((p) => {
      const price = activePrice(p).price;
      let score = 0;
      const cap = p.washCapacityKg ?? 0;
      if (cap >= minCap) score += 3;
      if (household === "5+" && cap >= 12) score += 1;
      if (price <= budgetMax) score += 4;
      else score -= Math.min(6, Math.round((price - budgetMax) / 15000));
      if (a.space === "small" && p.category === "combos") score += 2;
      if (a.space === "small" && p.type === "Top-load") score -= 1;
      if (a.priority === "hygiene" && p.features.includes("SpaCare steam wash")) score += 3;
      if (a.priority === "running" && ["A+++", "A++"].includes(p.energyRating ?? "")) score += 3;
      if (a.priority === "quiet" && p.motor.includes("BLDC")) score += 3;
      if (a.priority === "price") score += Math.max(0, 3 - Math.floor(price / 40000));
      return { p, score, price };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);

  return Response.json({
    results: scored.map(({ p, price }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      modelNumber: p.modelNumber,
      shortBenefit: p.shortBenefit,
      price,
      image: p.images[0] ?? null,
    })),
  });
}
