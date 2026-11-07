import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones, products, reviews, type Product } from "@/db/schema";
import { activePrice, SECTIONS, type Section } from "@/lib/format";
import { ensureSeed } from "@/lib/seed";

export async function allProducts(): Promise<Product[]> {
  await ensureSeed();
  return db.select().from(products).where(eq(products.archived, false)).orderBy(desc(products.popularity));
}

export async function productsForSection(section: Section) {
  await ensureSeed();
  return db
    .select()
    .from(products)
    .where(and(eq(products.archived, false), inArray(products.category, SECTIONS[section].listCategories ?? SECTIONS[section].categories)))
    .orderBy(desc(products.popularity));
}

export async function productsByIds(ids: number[]) {
  if (!ids.length) return [];
  await ensureSeed();
  const rows = await db.select().from(products).where(and(eq(products.archived, false), inArray(products.id, ids)));
  return ids.flatMap((id) => rows.filter((p) => p.id === id));
}

export async function featuredProducts() {
  const all = await allProducts();
  const f = all.filter((p) => p.featured);
  return f.length ? f : all.slice(0, 4);
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
    .limit(n);
  return rows;
}

export function hasFeature(p: Product, feature: string) {
  if (feature === "Dryer function") return !!p.dryCapacityKg;
  if (feature === "Inverter motor") return p.motor.includes("BLDC");
  return p.features.includes(feature) || (feature === "Heat pump" && p.type === "Heat-pump dryer");
}

export async function zones(activeOnly = true) {
  await ensureSeed();
  const rows = await db.select().from(deliveryZones).orderBy(deliveryZones.id);
  return activeOnly ? rows.filter((z) => z.active) : rows;
}

export async function publishedReviews(productId?: number, limit = 12) {
  const rows = await db.select().from(reviews).where(eq(reviews.published, true)).orderBy(desc(reviews.createdAt)).limit(60);
  const f = productId ? rows.filter((r) => r.productId === productId) : rows;
  return f.slice(0, limit);
}

export type Filters = {
  types: string[];
  features: string[];
  brand?: string;
  capMin?: number;
  capMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort: string;
  inStock: boolean;
};

const arr = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const num = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const brand = Array.isArray(sp.brand) ? sp.brand[0] : sp.brand;
  return {
    types: arr(sp.type),
    features: arr(sp.feature),
    brand: brand || undefined,
    capMin: num(sp.capMin),
    capMax: num(sp.capMax),
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    sort: (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) || "popular",
    inStock: sp.inStock === "1",
  };
}

export function applyFilters(list: Product[], f: Filters) {
  let out = list.filter((p) => {
    const cap = p.washCapacityKg ?? p.dryCapacityKg ?? 0;
    const price = activePrice(p).price;
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.brand && p.brand !== f.brand) return false;
    if (f.capMin && cap < f.capMin) return false;
    if (f.capMax && cap > f.capMax) return false;
    if (f.priceMin && price < f.priceMin) return false;
    if (f.priceMax && price > f.priceMax) return false;
    if (f.inStock && p.stockQty <= 0) return false;
    return f.features.every((feat) => hasFeature(p, feat));
  });
  out = [...out].sort((a, b) => {
    switch (f.sort) {
      case "price-asc":
        return activePrice(a).price - activePrice(b).price;
      case "price-desc":
        return activePrice(b).price - activePrice(a).price;
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
      default:
        return b.popularity - a.popularity;
    }
  });
  return out;
}

export function searchProducts(list: Product[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const terms = query.split(/\s+/);
  return list.filter((p) => {
    const hay = [
      p.name,
      p.brand,
      p.modelNumber,
      p.type,
      p.category,
      p.colour ?? "",
      p.features.join(" "),
      p.washCapacityKg ? `${p.washCapacityKg}kg ${p.washCapacityKg} kg` : "",
      p.dryCapacityKg ? `${p.dryCapacityKg}kg ${p.dryCapacityKg} kg` : "",
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
