import type { Product } from "@/db/schema";

export const ksh = (n: number | null | undefined) =>
  n == null ? "—" : `KSh ${Math.round(n).toLocaleString("en-KE")}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type Section = "washing-machines" | "combos" | "dryers" | "other-appliances";

export const SECTIONS: Record<
  Section,
  { title: string; h1: string; categories: string[]; listCategories?: string[]; metaTitle: string; metaDesc: string }
> = {
  "washing-machines": {
    title: "Washing Machines",
    h1: "Front-load & top-load washing machines in Kenya",
    categories: ["washers"],
    listCategories: ["washers", "combos"],
    metaTitle: "MIKA Washing Machine Price Kenya | 12kg Front Load Washers",
    metaDesc:
      "Shop MIKA front-load washing machines in Kenya: 8–12kg, SpaCare steam wash, BLDC inverter motor. Free delivery & installation in zones, M-Pesa or Pay on Delivery.",
  },
  combos: {
    title: "Washer-Dryer Combos",
    h1: "Washer-dryer combos for Nairobi apartments",
    categories: ["combos"],
    metaTitle: "Washer Dryer Combo Nairobi | MIKA Wash & Dry in One Machine",
    metaDesc:
      "Washer dryer combo in Nairobi: wash and dry in one machine, no line-drying, no vent pipe. MIKA 10/7kg combos with steam wash and inverter motor.",
  },
  dryers: {
    title: "Tumble Dryers",
    h1: "Heat pump & tumble dryers in Kenya",
    categories: ["dryers"],
    metaTitle: "Heat Pump Dryer Kenya | Tumble Dryers with Low Running Cost",
    metaDesc:
      "Heat pump dryer in Kenya: lower power use, gentle on clothes, no vent pipe needed. Browse 8–10kg tumble dryers with free delivery in zones.",
  },
  "other-appliances": {
    title: "Other Appliances",
    h1: "Fridges, microwaves & entry-level washers",
    categories: ["fridges", "microwaves", "entry-washers"],
    metaTitle: "Fridges, Microwaves & Budget Washing Machines Kenya",
    metaDesc:
      "Fridges, microwaves and entry-level washing machines with Pay on Delivery in Kenya. Reliable appliances from KSh 30,000.",
  },
};

export const CATEGORY_LABEL: Record<string, string> = {
  washers: "Front-load washer",
  combos: "Washer-dryer combo",
  dryers: "Tumble dryer",
  fridges: "Fridge",
  microwaves: "Microwave",
  "entry-washers": "Entry-level washer",
};

export const CATEGORY_IMAGE: Record<string, string> = {
  washers: "/images/washer.svg",
  combos: "/images/combo.svg",
  dryers: "/images/dryer.svg",
  fridges: "/images/fridge.svg",
  microwaves: "/images/microwave.svg",
  "entry-washers": "/images/washer.svg",
};

export const isRemoteImage = (src: string) => /^https?:/i.test(src);

export const MAX_COMPARE = 3;

export function sectionOf(category: string): Section {
  for (const [k, v] of Object.entries(SECTIONS)) {
    if (v.categories.includes(category)) return k as Section;
  }
  return "other-appliances";
}

export const productPath = (p: Pick<Product, "category" | "slug">) =>
  `/${sectionOf(p.category)}/${p.slug}`;

export function activePrice(p: Product, now = new Date()) {
  const o = p.offerPriceKsh;
  if (o == null || o >= p.priceKsh) return { price: p.priceKsh, onOffer: false };
  if (p.offerStart && p.offerStart > now) return { price: p.priceKsh, onOffer: false };
  if (p.offerEnd && p.offerEnd < now) return { price: p.priceKsh, onOffer: false };
  return { price: o, onOffer: true };
}

export function stockState(p: Product) {
  if (p.stockQty <= 0) return { key: "out", label: "Out of stock", cls: "bg-red-100 text-red-800" } as const;
  if (p.stockQty <= p.lowStockAt)
    return { key: "low", label: `Only ${p.stockQty} left`, cls: "bg-amber-100 text-amber-900" } as const;
  return { key: "in", label: "In stock", cls: "bg-emerald-100 text-emerald-800" } as const;
}

export function productImage(p: Product) {
  return p.images[0] || CATEGORY_IMAGE[p.category] || "/images/washer.svg";
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

export function capacityLabel(p: Product) {
  if (p.washCapacityKg && p.dryCapacityKg) return `${p.washCapacityKg}/${p.dryCapacityKg}kg`;
  if (p.washCapacityKg) return `${p.washCapacityKg}kg`;
  if (p.dryCapacityKg) return `${p.dryCapacityKg}kg dry`;
  return "";
}

export const FEATURES = [
  "SpaCare steam wash",
  "Auto-dose",
  "Microfiber catcher",
  "Drum clean",
  "Baby care",
  "Quick 15'",
  "Heat pump",
  "Ozone/Airwash",
] as const;

export const TYPES = ["Front-load", "Top-load", "Twin-tub", "Washer-dryer", "Heat-pump dryer", "Condenser dryer", "Fridge", "Microwave"];

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
