import type { Product } from "@/db/schema";
import { catDef } from "@/lib/catalog";

export const ksh = (n: number | null | undefined) =>
  n == null ? "—" : `KSh ${Math.round(n).toLocaleString("en-KE")}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isRemoteImage = (src: string) => /^https?:/i.test(src);

export const MAX_COMPARE = 3;
export const PAGE_SIZE = 24;
export const MIN_REVIEWS_FOR_RATING = 3;

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

export const productPath = (p: Pick<Product, "category" | "subcategory" | "slug">) =>
  `/${p.category}/${p.subcategory || "all"}/${p.slug}`;

type OfferFields = Pick<Product, "priceKsh" | "offerPriceKsh" | "offerStart" | "offerEnd" | "offerQtyCap" | "offerSold">;

export function activePrice(p: OfferFields, now = new Date()) {
  const o = p.offerPriceKsh;
  const regular = { price: p.priceKsh, onOffer: false };
  if (o == null || o >= p.priceKsh) return regular;
  if (p.offerStart && p.offerStart > now) return regular;
  if (p.offerEnd && p.offerEnd < now) return regular;
  if (p.offerQtyCap != null && p.offerSold >= p.offerQtyCap) return regular;
  return { price: o, onOffer: true };
}

export const isFlash = (p: OfferFields) => activePrice(p).onOffer && p.offerQtyCap != null;

// Now price, the genuine was-price (if any), saving and whole-percent discount (computed, never typed).
export function priceInfo(p: OfferFields & Pick<Product, "wasPriceKsh">, now = new Date()) {
  const { price, onOffer } = activePrice(p, now);
  const was = Math.max(onOffer ? p.priceKsh : 0, p.wasPriceKsh ?? 0);
  const hasWas = was > price;
  const save = hasWas ? was - price : 0;
  return { price, onOffer, was: hasWas ? was : null, save, pct: hasWas ? Math.round((save / was) * 100) : 0 };
}

export function stockState(p: Product) {
  if (p.stockQty <= 0) return { key: "out", label: "Out of stock", cls: "bg-red-100 text-red-800" } as const;
  if (p.stockQty <= p.lowStockAt)
    return { key: "low", label: `Only ${p.stockQty} left`, cls: "bg-amber-100 text-amber-900" } as const;
  return { key: "in", label: "In stock", cls: "bg-emerald-100 text-emerald-800" } as const;
}

export function categoryImage(category: string, sub?: string) {
  const def = catDef(category);
  return def?.subs.find((s) => s.slug === sub)?.image || def?.image || "/images/washer.svg";
}

export function productImage(p: Pick<Product, "images" | "category" | "subcategory">) {
  return p.images[0] || categoryImage(p.category, p.subcategory);
}

// Only shown when the financing partner's approved rates are entered in Settings ("months:markup%").
export function indicativeMonthly(price: number, rates: string) {
  const plans = rates
    .split(",")
    .map((r) => r.split(":").map((x) => Number(x.trim())))
    .filter(([months, pct]) => months > 0 && pct >= 0);
  if (!plans.length) return null;
  const [months, pct] = plans.reduce((a, b) => (b[0] > a[0] ? b : a));
  return { months, monthly: Math.ceil((price * (1 + pct / 100)) / months) };
}

export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export const featureAnchor = (f: string) => {
  const m: Record<string, string> = {
    "SpaCare steam wash": "spacare",
    "Auto-dose": "auto-dose",
    "Microfiber catcher": "microfiber-catcher",
    "Drum clean": "drum-clean",
    "Heat pump": "heat-pump",
    "Baby care": "spacare",
    "Ozone/Airwash": "spacare",
    "Quick 15'": "quick-wash",
  };
  return m[f] ?? "";
};

export function normalisePhone(raw: string): string | null {
  const d = raw.replace(/[\s\-()]/g, "");
  let m = d.match(/^(?:\+?254|0)([17]\d{8})$/);
  if (!m) return null;
  return `254${m[1]}`;
}

export const waLink = (number: string, message: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
