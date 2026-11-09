import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { categories, deliveryZones, installServices, products, reviews, type Product } from "@/db/schema";
import { CATALOG, catDef, filterValues, type CatDef, type FilterDef } from "@/lib/catalog";
import { getCustomer } from "@/lib/customer-auth";
import { activePrice, categoryImage, isFlash, priceInfo } from "@/lib/format";
import { activeCampaigns, campaignMultiplier, earnPoints, getRewardsConfig, isTier } from "@/lib/rewards";
import { ensureSeed } from "@/lib/seed";
import { getSettings } from "@/lib/settings";

// Sub-categories need this many live products before they show in menus and tiles (PRD CT-1).
export const MIN_SUB_PRODUCTS = 3;

export type MenuSub = { slug: string; path: string; name: string; image: string; intro: string; count: number; visible: boolean; order: number; active: boolean };
export type MenuCat = {
  slug: string;
  path: string;
  name: string;
  image: string;
  isCore: boolean;
  intro: string;
  marginFloorPct: number;
  order: number;
  active: boolean;
  count: number;
  subs: MenuSub[];
  def: CatDef;
};

export const allProducts = cache(async (): Promise<Product[]> => {
  await ensureSeed();
  return db.select().from(products).where(eq(products.archived, false)).orderBy(desc(products.popularity));
});

// Category tree merged from the editable `categories` table and the code taxonomy.
export const getCategoryTree = cache(async (includeInactive = false): Promise<MenuCat[]> => {
  await ensureSeed();
  const [rows, counts] = await Promise.all([
    db.select().from(categories),
    db
      .select({ category: products.category, sub: products.subcategory, n: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.archived, false))
      .groupBy(products.category, products.subcategory),
  ]);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const count = (cat: string, sub?: string) => counts.filter((c) => c.category === cat && (sub == null || c.sub === sub)).reduce((n, c) => n + c.n, 0);

  const tree = CATALOG.map((def, i): MenuCat => {
    const r = bySlug.get(def.slug);
    const codeSubs = def.subs.map((s) => s.slug);
    const dbSubs = rows.filter((x) => x.parent === def.slug).map((x) => x.slug.split("/")[1]);
    const subSlugs = [...new Set([...codeSubs, ...dbSubs])];
    const subs = subSlugs
      .map((slug, j): MenuSub => {
        const sr = bySlug.get(`${def.slug}/${slug}`);
        const code = def.subs.find((s) => s.slug === slug);
        const n = count(def.slug, slug);
        const active = sr?.active ?? true;
        return {
          slug,
          path: `/${def.slug}/${slug}`,
          name: sr?.name || code?.name || slug,
          image: sr?.tileImage || categoryImage(def.slug, slug),
          intro: sr?.intro ?? "",
          count: n,
          active,
          visible: active && n >= MIN_SUB_PRODUCTS,
          order: sr?.menuOrder ?? j,
        };
      })
      .sort((a, b) => a.order - b.order);
    return {
      slug: def.slug,
      path: `/${def.slug}`,
      name: r?.name || def.name,
      image: r?.tileImage || def.image,
      isCore: r?.isCore ?? def.core,
      intro: r?.intro ?? def.metaDesc,
      marginFloorPct: r?.marginFloorPct ?? def.marginFloorPct,
      order: r?.menuOrder ?? i,
      active: r?.active ?? true,
      count: count(def.slug),
      subs,
      def,
    };
  });
  return tree.filter((c) => includeInactive || c.active).sort((a, b) => a.order - b.order);
});

export async function findCategory(slug: string) {
  return (await getCategoryTree()).find((c) => c.slug === slug) ?? null;
}

export async function marginFloorFor(category: string) {
  return (await getCategoryTree(true)).find((c) => c.slug === category)?.marginFloorPct ?? catDef(category)?.marginFloorPct ?? null;
}

export async function productsByIds(ids: number[]) {
  if (!ids.length) return [];
  await ensureSeed();
  const rows = await db.select().from(products).where(and(eq(products.archived, false), inArray(products.id, ids)));
  return ids.flatMap((id) => rows.filter((p) => p.id === id));
}

export async function productBySlug(slug: string) {
  await ensureSeed();
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return p && !p.archived ? p : null;
}

export async function relatedProducts(p: Product, n = 4) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.archived, false), eq(products.category, p.category), ne(products.id, p.id)))
    .orderBy(desc(products.popularity))
    .limit(24);
  const same = rows.filter((r) => r.subcategory === p.subcategory);
  return [...same, ...rows.filter((r) => r.subcategory !== p.subcategory)].slice(0, n);
}

// "Frequently bought together": best seller from each add-on sub-category of this category.
export async function addOnProducts(categorySlugs: string[], excludeIds: number[] = [], limit = 3) {
  const paths = [...new Set(categorySlugs.flatMap((c) => catDef(c)?.addOns ?? []))];
  if (!paths.length) return [];
  const all = await allProducts();
  const out: Product[] = [];
  for (const path of paths) {
    const [cat, sub] = path.split("/");
    const hit = all.find((p) => p.category === cat && p.subcategory === sub && p.stockQty > 0 && !excludeIds.includes(p.id));
    if (hit) out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

export const isAddOnFor = (p: Pick<Product, "category" | "subcategory">, mainCategories: string[]) =>
  mainCategories.some((c) => (catDef(c)?.addOns ?? []).includes(`${p.category}/${p.subcategory}`));

export const zones = cache(async (activeOnly = true) => {
  await ensureSeed();
  const rows = await db.select().from(deliveryZones).orderBy(deliveryZones.id);
  return activeOnly ? rows.filter((z) => z.active) : rows;
});

export const getInstallServices = cache(async (activeOnly = true) => {
  await ensureSeed();
  const rows = await db.select().from(installServices).orderBy(asc(installServices.id));
  return activeOnly ? rows.filter((s) => s.active) : rows;
});

export async function publishedReviews(productId?: number, limit = 12) {
  const rows = await db.select().from(reviews).where(eq(reviews.published, true)).orderBy(desc(reviews.createdAt)).limit(200);
  const f = productId ? rows.filter((r) => r.productId === productId) : rows;
  return f.slice(0, limit);
}

export const verifiedReviews = cache(async (limit = 10) =>
  db.select().from(reviews).where(and(eq(reviews.published, true), eq(reviews.verified, true))).orderBy(desc(reviews.createdAt)).limit(limit),
);

export const ratingsMap = cache(async () => {
  try {
    const rows = await db
      .select({ productId: reviews.productId, avg: sql<number>`avg(${reviews.rating})::float`, n: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.published, true))
      .groupBy(reviews.productId);
    return new Map(rows.filter((r) => r.productId != null).map((r) => [r.productId!, { avg: r.avg, n: r.n }]));
  } catch {
    return new Map<number, { avg: number; n: number }>();
  }
});

// What every product card needs: the shopper's earn rate (tier-adjusted when signed in), campaigns and ratings.
export const getCardContext = cache(async () => {
  const [s, cfg, campaigns, customer, ratings] = await Promise.all([getSettings(), getRewardsConfig(), activeCampaigns(), getCustomer(), ratingsMap()]);
  const tier = customer && isTier(customer.tier) ? customer.tier : "bronze";
  return { whatsapp: s.whatsapp, rate: cfg.rate[tier], tier, signedIn: !!customer, campaigns, ratings };
});
export type CardContext = Awaited<ReturnType<typeof getCardContext>>;

export const productPoints = (p: Product, ctx: Pick<CardContext, "rate" | "campaigns">) =>
  earnPoints(activePrice(p).price, ctx.rate, campaignMultiplier(p, ctx.campaigns));

// ---------- listing filters ----------

export type Listing = {
  sort: string;
  page: number;
  priceMin?: number;
  priceMax?: number;
  inStock: boolean;
  sel: Record<string, string[]>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const arr = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const num = (v: string | string[] | undefined) => {
  const n = Number(first(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseListing(sp: Record<string, string | string[] | undefined>, filters: FilterDef[]): Listing {
  const sel: Record<string, string[]> = {};
  for (const f of filters) {
    const v = arr(sp[f.key]);
    if (v.length) sel[f.key] = v;
  }
  return {
    sort: first(sp.sort) || "popular",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    inStock: sp.inStock === "1",
    sel,
  };
}

function passes(p: Product, filters: FilterDef[], q: Listing, skip?: string) {
  const price = activePrice(p).price;
  if (q.priceMin && price < q.priceMin) return false;
  if (q.priceMax && price > q.priceMax) return false;
  if (q.inStock && p.stockQty <= 0) return false;
  for (const f of filters) {
    if (f.key === skip) continue;
    const want = q.sel[f.key];
    if (!want?.length) continue;
    const have = filterValues(p, f);
    if (!want.some((w) => have.includes(w))) return false;
  }
  return true;
}

export function applyListing(list: Product[], filters: FilterDef[], q: Listing, ctx: Pick<CardContext, "rate" | "campaigns">) {
  const out = list.filter((p) => passes(p, filters, q));
  const pts = (p: Product) => productPoints(p, ctx);
  return out.sort((a, b) => {
    switch (q.sort) {
      case "price-asc":
        return activePrice(a).price - activePrice(b).price;
      case "price-desc":
        return activePrice(b).price - activePrice(a).price;
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
      case "discount":
        return priceInfo(b).pct - priceInfo(a).pct || b.popularity - a.popularity;
      case "points":
        return pts(b) - pts(a);
      default:
        return b.popularity - a.popularity;
    }
  });
}

// Option counts per filter, each counted against the other active filters, e.g. "10kg (1)".
export function facetCounts(list: Product[], filters: FilterDef[], q: Listing) {
  return filters
    .map((f) => {
      const counts = new Map<string, number>();
      for (const p of list) {
        if (!passes(p, filters, q, f.key)) continue;
        for (const v of filterValues(p, f)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const order = f.buckets?.map((b) => b[0]);
      const values = [...counts.entries()].sort((a, b) =>
        order ? order.indexOf(a[0]) - order.indexOf(b[0]) : Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]),
      );
      return { f, values };
    })
    .filter((x) => x.values.length > 1 || (x.f.kind === "bool" && x.values.length > 0) || (x.values.length > 0 && x.f.key in q.sel));
}

export const onOfferProducts = (list: Product[]) => list.filter((p) => priceInfo(p).was != null);
export const flashProducts = (list: Product[]) => list.filter((p) => isFlash(p));

export function searchProducts(list: Product[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const terms = query.split(/\s+/);
  return list.filter((p) => {
    const def = catDef(p.category);
    const hay = [
      p.name,
      p.brand,
      p.modelNumber,
      p.type,
      def?.name ?? "",
      def?.subs.find((s) => s.slug === p.subcategory)?.name ?? "",
      p.colour ?? "",
      p.features.join(" "),
      Object.values(p.specs).join(" "),
      p.washCapacityKg ? `${p.washCapacityKg}kg ${p.washCapacityKg} kg` : "",
      p.dryCapacityKg ? `${p.dryCapacityKg}kg ${p.dryCapacityKg} kg` : "",
      p.specs.screenSize ? `${p.specs.screenSize}" ${p.specs.screenSize} inch` : "",
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function hasFeature(p: Product, feature: string) {
  if (feature === "Dryer function") return !!p.dryCapacityKg;
  if (feature === "Inverter motor") return p.motor.includes("BLDC");
  return p.features.includes(feature) || (feature === "Heat pump" && p.type === "Heat-pump dryer");
}
