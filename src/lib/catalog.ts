import type { Product } from "@/db/schema";

// Behaviour per top-level category lives in code (spec template, filters, add-ons).
// Names, tile images, menu order, intros and margin floors are seeded into the
// `categories` table and edited in admin.

export type SpecField = { key: string; label: string; type: "text" | "number" | "select" | "bool"; options?: string[]; unit?: string };
export type FilterDef = {
  key: string;
  label: string;
  kind: "multi" | "bool";
  unit?: string;
  split?: boolean; // value is a comma list, e.g. "Bluetooth, HDMI ARC"
  buckets?: [string, number, number][]; // [label, min, max)
};
export type SubDef = { slug: string; name: string; image?: string };
export type CatDef = {
  slug: string;
  name: string;
  core: boolean;
  image: string;
  h1: string;
  metaTitle: string;
  metaDesc: string;
  subs: SubDef[];
  specs: SpecField[];
  filters: FilterDef[];
  addOns: string[]; // "category/sub" paths suggested with this category (cross-sell)
  marginFloorPct: number;
};

const YES_NO = ["Yes", "No"];
const ENERGY = ["A+++", "A++", "A+", "A", "B", "C"];
const BASIC_SPECS: SpecField[] = [
  { key: "capacity", label: "Capacity / size", type: "text" },
  { key: "powerW", label: "Power", type: "number", unit: "W" },
];
const BASIC_FILTERS: FilterDef[] = [
  { key: "type", label: "Type", kind: "multi" },
  { key: "capacity", label: "Capacity", kind: "multi" },
  { key: "brand", label: "Brand", kind: "multi" },
];

export const CATALOG: CatDef[] = [
  {
    slug: "tvs",
    name: "TVs",
    core: true,
    image: "/images/tv.svg",
    h1: "TVs in Kenya: Smart, 4K, QLED & OLED",
    metaTitle: "Smart TV Price Kenya | 32\" to 85\" 4K, QLED & OLED TVs",
    metaDesc: "Smart TV prices in Kenya from 32\" to 85\". 4K, QLED and OLED TVs from LG, Samsung, Hisense and more, with points on every TV, delivery and wall mounting.",
    subs: [
      { slug: "smart-tvs", name: "Smart TVs" },
      { slug: "led-tvs", name: "LED TVs" },
      { slug: "qled-oled-tvs", name: "QLED & OLED TVs" },
      { slug: "wall-mounts-stands", name: "Wall mounts & stands", image: "/images/mount.svg" },
    ],
    specs: [
      { key: "screenSize", label: "Screen size", type: "number", unit: "\"" },
      { key: "resolution", label: "Resolution", type: "select", options: ["HD", "Full HD", "4K UHD", "8K"] },
      { key: "panel", label: "Panel", type: "select", options: ["LED", "QLED", "OLED", "Mini LED"] },
      { key: "platform", label: "Smart platform", type: "select", options: ["Android TV", "Google TV", "VIDAA", "webOS", "Tizen", "Not smart"] },
      { key: "refreshHz", label: "Refresh rate", type: "number", unit: "Hz" },
      { key: "hdmi", label: "HDMI ports", type: "number" },
    ],
    filters: [
      { key: "screenSize", label: "Screen size", kind: "multi", unit: "\"" },
      { key: "resolution", label: "Resolution", kind: "multi" },
      { key: "panel", label: "Panel", kind: "multi" },
      { key: "platform", label: "Smart platform", kind: "multi" },
      { key: "brand", label: "Brand", kind: "multi" },
    ],
    addOns: ["audio/soundbars", "tvs/wall-mounts-stands", "power-guards/tv-guards"],
    marginFloorPct: 8,
  },
  {
    slug: "audio",
    name: "Audio",
    core: true,
    image: "/images/audio.svg",
    h1: "Soundbars, home theatre & speakers in Kenya",
    metaTitle: "Soundbar Kenya | Home Theatre, Bluetooth & Party Speakers",
    metaDesc: "Soundbars, home theatre systems, Bluetooth and party speakers in Kenya. Compare power and connectivity, earn points and get fast delivery.",
    subs: [
      { slug: "soundbars", name: "Soundbars" },
      { slug: "home-theatre", name: "Home theatre" },
      { slug: "speakers", name: "Bluetooth & party speakers" },
      { slug: "hifi-micro-systems", name: "Hi-fi & micro systems" },
      { slug: "radios", name: "Radios" },
      { slug: "headphones", name: "Headphones" },
    ],
    specs: [
      { key: "powerW", label: "Power", type: "number", unit: "W" },
      { key: "connectivity", label: "Connectivity (comma separated)", type: "text" },
      { key: "channels", label: "Channels", type: "text" },
    ],
    filters: [
      { key: "type", label: "Type", kind: "multi" },
      { key: "powerW", label: "Power", kind: "multi", buckets: [["Under 100W", 0, 100], ["100–299W", 100, 300], ["300–599W", 300, 600], ["600W+", 600, 1e9]] },
      { key: "connectivity", label: "Connectivity", kind: "multi", split: true },
      { key: "brand", label: "Brand", kind: "multi" },
    ],
    addOns: ["power-guards/tv-guards"],
    marginFloorPct: 10,
  },
  {
    slug: "fridges",
    name: "Fridges",
    core: true,
    image: "/images/fridge.svg",
    h1: "Fridges & freezers in Kenya",
    metaTitle: "Fridge Price Kenya | Double Door, Side-by-Side & Freezers",
    metaDesc: "Fridge prices in Kenya: single and double door, side-by-side, French-door, bar fridges, freezers and chillers. Inverter models, points on every fridge.",
    subs: [
      { slug: "single-door", name: "Single-door fridges" },
      { slug: "double-door", name: "Double-door fridges" },
      { slug: "side-by-side", name: "Side-by-side fridges" },
      { slug: "french-door", name: "French-door fridges" },
      { slug: "bar-mini-fridges", name: "Bar & mini fridges" },
      { slug: "freezers", name: "Freezers" },
      { slug: "ice-makers", name: "Ice makers", image: "/images/commercial.svg" },
      { slug: "wine-chillers", name: "Wine chillers" },
      { slug: "showcase-chillers", name: "Showcase & back-bar chillers", image: "/images/commercial.svg" },
    ],
    specs: [
      { key: "capacityL", label: "Capacity", type: "number", unit: "L" },
      { key: "doors", label: "Doors", type: "select", options: ["1", "2", "3", "4+"] },
      { key: "inverter", label: "Inverter compressor", type: "select", options: YES_NO },
      { key: "waterDispenser", label: "Water dispenser", type: "select", options: YES_NO },
      { key: "defrost", label: "Defrost", type: "select", options: ["Frost-free", "Direct cool"] },
    ],
    filters: [
      { key: "type", label: "Type", kind: "multi" },
      { key: "capacityL", label: "Capacity", kind: "multi", buckets: [["Under 150L", 0, 150], ["150–299L", 150, 300], ["300–499L", 300, 500], ["500L+", 500, 1e9]] },
      { key: "doors", label: "Doors", kind: "multi" },
      { key: "energy", label: "Energy rating", kind: "multi" },
      { key: "inverter", label: "Inverter compressor", kind: "bool" },
      { key: "waterDispenser", label: "Water dispenser", kind: "bool" },
      { key: "brand", label: "Brand", kind: "multi" },
    ],
    addOns: ["power-guards/fridge-guards"],
    marginFloorPct: 8,
  },
  {
    slug: "washers",
    name: "Washers",
    core: true,
    image: "/images/washer.svg",
    h1: "Washing machines, washer-dryers & tumble dryers in Kenya",
    metaTitle: "Washing Machine Price Kenya | Front Load, Washer Dryer & MIKA Dryers",
    metaDesc: "Washing machine prices in Kenya: front-load, top-load, twin-tub, washer-dryer combos and heat-pump tumble dryers. Steam wash, inverter motors, points on every machine.",
    subs: [
      { slug: "front-load", name: "Front-load washers" },
      { slug: "top-load", name: "Top-load washers" },
      { slug: "twin-tub", name: "Twin-tub washers" },
      { slug: "washer-dryers", name: "Washer-dryer combos", image: "/images/combo.svg" },
      { slug: "tumble-dryers", name: "Tumble dryers", image: "/images/dryer.svg" },
      { slug: "irons-steamers", name: "Irons & steamers", image: "/images/iron.svg" },
      { slug: "laundry-accessories", name: "Ironing boards, baskets & care", image: "/images/basket.svg" },
    ],
    specs: [], // washers use the dedicated laundry columns (capacity, spin, motor, features)
    filters: [
      { key: "type", label: "Type", kind: "multi" },
      { key: "capacityKg", label: "Capacity", kind: "multi", unit: "kg" },
      { key: "dryer", label: "Dryer function", kind: "bool" },
      { key: "steam", label: "Steam wash", kind: "bool" },
      { key: "inverter", label: "Inverter motor", kind: "bool" },
      { key: "brand", label: "Brand", kind: "multi" },
    ],
    addOns: ["washers/irons-steamers", "washers/laundry-accessories"],
    marginFloorPct: 8,
  },
  {
    slug: "cookers",
    name: "Cookers",
    core: true,
    image: "/images/cooker.svg",
    h1: "Gas, electric & induction cookers in Kenya",
    metaTitle: "Gas Cooker Price Kenya | Standing Cookers, Table-top & Induction",
    metaDesc: "Gas cooker prices in Kenya: full gas, electric and gas-electric standing cookers, table-top gas, induction cookers, built-in hobs and cooker hoods.",
    subs: [
      { slug: "standing-cookers", name: "Standing cookers" },
      { slug: "table-top-gas", name: "Table-top gas cookers" },
      { slug: "induction-portable", name: "Induction & portable" },
      { slug: "built-in-hobs-ovens", name: "Built-in hobs & ovens", image: "/images/oven.svg" },
      { slug: "cooker-hoods", name: "Cooker hoods", image: "/images/hood.svg" },
    ],
    specs: [
      { key: "fuel", label: "Fuel", type: "select", options: ["Full gas", "Full electric", "Gas + electric", "Induction"] },
      { key: "burners", label: "Burners", type: "number" },
      { key: "ovenL", label: "Oven size", type: "number", unit: "L" },
      { key: "widthCm", label: "Width", type: "select", options: ["30", "50", "60", "90"], unit: "cm" },
    ],
    filters: [
      { key: "type", label: "Type", kind: "multi" },
      { key: "fuel", label: "Fuel", kind: "multi" },
      { key: "burners", label: "Burners", kind: "multi" },
      { key: "ovenL", label: "Oven size", kind: "multi", unit: "L" },
      { key: "widthCm", label: "Width", kind: "multi", unit: "cm" },
      { key: "brand", label: "Brand", kind: "multi" },
    ],
    addOns: ["cookers/cooker-hoods", "kitchen-appliances/microwaves"],
    marginFloorPct: 8,
  },
  {
    slug: "kitchen-appliances",
    name: "Kitchen Appliances",
    core: false,
    image: "/images/microwave.svg",
    h1: "Small kitchen appliances in Kenya",
    metaTitle: "Microwaves, Air Fryers, Blenders & Kettles Kenya",
    metaDesc: "Microwaves, air fryers, deep fryers, rice cookers, smart pressure cookers, blenders and kettles in Kenya, with points on every purchase.",
    subs: [
      { slug: "microwaves", name: "Microwaves" },
      { slug: "air-fryers", name: "Air fryers", image: "/images/kitchen.svg" },
      { slug: "deep-fryers", name: "Deep fryers", image: "/images/kitchen.svg" },
      { slug: "rice-cookers", name: "Rice cookers", image: "/images/kitchen.svg" },
      { slug: "pressure-cookers", name: "Smart pressure cookers", image: "/images/kitchen.svg" },
      { slug: "blenders", name: "Blenders", image: "/images/blender.svg" },
      { slug: "kettles", name: "Kettles", image: "/images/kettle.svg" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 12,
  },
  {
    slug: "built-in",
    name: "Built-in Appliances",
    core: false,
    image: "/images/oven.svg",
    h1: "Built-in ovens, hobs & microwaves",
    metaTitle: "Built-in Ovens & Hobs Kenya",
    metaDesc: "Built-in ovens, gas and electric hobs and built-in microwaves for modern Kenyan kitchens.",
    subs: [
      { slug: "built-in-ovens", name: "Built-in ovens" },
      { slug: "built-in-hobs", name: "Built-in hobs" },
      { slug: "built-in-microwaves", name: "Built-in microwaves", image: "/images/microwave.svg" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: ["cookers/cooker-hoods"],
    marginFloorPct: 10,
  },
  {
    slug: "water-dispensers",
    name: "Water Dispensers",
    core: false,
    image: "/images/water.svg",
    h1: "Water dispensers in Kenya",
    metaTitle: "Water Dispenser Price Kenya | Hot & Cold Dispensers",
    metaDesc: "Hot and cold water dispensers, top-load and bottom-load, for homes and offices in Kenya.",
    subs: [
      { slug: "top-load-dispensers", name: "Top-load dispensers" },
      { slug: "bottom-load-dispensers", name: "Bottom-load dispensers" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 10,
  },
  {
    slug: "cooling-heating",
    name: "Cooling & Heating",
    core: false,
    image: "/images/fan.svg",
    h1: "Fans, air conditioners & heaters",
    metaTitle: "Fans, Air Conditioners & Heaters Kenya",
    metaDesc: "Standing and ceiling fans, split air conditioners and room heaters in Kenya.",
    subs: [
      { slug: "fans", name: "Fans" },
      { slug: "air-conditioners", name: "Air conditioners" },
      { slug: "heaters", name: "Heaters" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 10,
  },
  {
    slug: "health-personal-care",
    name: "Health & Personal Care",
    core: false,
    image: "/images/personal.svg",
    h1: "Health & personal care appliances",
    metaTitle: "Hair Dryers, Shavers, Clippers & Scales Kenya",
    metaDesc: "Facial steamers, bathroom scales, hair clippers, hair dryers, straighteners and shavers in Kenya.",
    subs: [
      { slug: "facial-steamers", name: "Facial steamers & kits" },
      { slug: "scales", name: "Scales" },
      { slug: "clippers", name: "Clippers & trimmers" },
      { slug: "hair-dryers", name: "Hair dryers" },
      { slug: "straighteners", name: "Straighteners" },
      { slug: "shavers", name: "Shavers" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 15,
  },
  {
    slug: "power-guards",
    name: "Power Guards",
    core: false,
    image: "/images/power.svg",
    h1: "Power guards & surge protectors",
    metaTitle: "Fridge Guard & TV Guard Kenya | Surge Protectors",
    metaDesc: "Protect your fridge, TV and electronics from power surges with fridge guards, TV guards and surge-protected extensions.",
    subs: [
      { slug: "fridge-guards", name: "Fridge guards" },
      { slug: "tv-guards", name: "TV guards" },
      { slug: "extension-guards", name: "Surge-protected extensions" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 20,
  },
  {
    slug: "home-cleaning",
    name: "Home Cleaning",
    core: false,
    image: "/images/vacuum.svg",
    h1: "Vacuum cleaners & home cleaning",
    metaTitle: "Vacuum Cleaners & Steam Mops Kenya",
    metaDesc: "Vacuum cleaners, wet and dry vacuums and steam mops for Kenyan homes.",
    subs: [
      { slug: "vacuum-cleaners", name: "Vacuum cleaners" },
      { slug: "steam-mops", name: "Steam mops" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 12,
  },
  {
    slug: "kitchenware",
    name: "Kitchenware",
    core: false,
    image: "/images/pot.svg",
    h1: "Cookware & kitchenware",
    metaTitle: "Cookware Sets & Kitchenware Kenya",
    metaDesc: "Non-stick cookware sets, pressure pots and kitchen utensils in Kenya.",
    subs: [
      { slug: "cookware", name: "Cookware sets" },
      { slug: "utensils", name: "Utensils & accessories" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 15,
  },
  {
    slug: "commercial",
    name: "Commercial",
    core: false,
    image: "/images/commercial.svg",
    h1: "Commercial appliances",
    metaTitle: "Commercial Dryers, Ice Makers & Chillers Kenya",
    metaDesc: "Commercial tumble dryers, ice makers and chillers for laundromats, hotels, bars and shops in Kenya.",
    subs: [
      { slug: "commercial-dryers", name: "Commercial dryers", image: "/images/dryer.svg" },
      { slug: "commercial-ice-makers", name: "Commercial ice makers" },
      { slug: "commercial-chillers", name: "Commercial chillers" },
    ],
    specs: BASIC_SPECS,
    filters: BASIC_FILTERS,
    addOns: [],
    marginFloorPct: 8,
  },
];

export const CAT_BY_SLUG = new Map(CATALOG.map((c) => [c.slug, c]));
export const catDef = (slug: string) => CAT_BY_SLUG.get(slug);

// v1 URLs and categories, kept so old links and saved carts keep working (PRD MG-3).
export const LEGACY_SECTIONS: Record<string, string> = {
  "washing-machines": "/washers",
  combos: "/washers/washer-dryers",
  dryers: "/washers/tumble-dryers",
  "other-appliances": "/",
};

export const LAUNDRY_FEATURES = [
  "SpaCare steam wash",
  "Auto-dose",
  "Microfiber catcher",
  "Drum clean",
  "Baby care",
  "Quick 15'",
  "Heat pump",
  "Ozone/Airwash",
] as const;

export const WASHER_TYPES = ["Front-load", "Top-load", "Twin-tub", "Washer-dryer", "Heat-pump dryer", "Condenser dryer", "Vented dryer", "Iron", "Steamer", "Accessory"];

const isInverter = (p: Product) => p.motor.includes("BLDC") || p.specs.inverter === "Yes";

// The value a filter or spec key reads from a product. Laundry keys map to the dedicated columns.
export function attr(p: Product, key: string): string {
  switch (key) {
    case "type":
      return p.type;
    case "brand":
      return p.brand;
    case "energy":
      return p.energyRating ?? "";
    case "capacityKg": {
      const kg = p.washCapacityKg ?? p.dryCapacityKg;
      return kg ? String(kg) : "";
    }
    case "dryer":
      return p.dryCapacityKg ? "Yes" : "";
    case "steam":
      return p.features.includes("SpaCare steam wash") ? "Yes" : "";
    case "inverter":
      return isInverter(p) ? "Yes" : "";
    default:
      return p.specs[key] ?? "";
  }
}

export function filterValues(p: Product, f: FilterDef): string[] {
  const raw = attr(p, f.key);
  if (!raw) return [];
  if (f.kind === "bool") return raw === "Yes" ? ["1"] : [];
  if (f.buckets) {
    const n = Number(raw);
    const b = f.buckets.find(([, min, max]) => n >= min && n < max);
    return b ? [b[0]] : [];
  }
  if (f.split) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [raw];
}

export const filterLabel = (f: FilterDef, v: string) => (f.unit && !f.buckets ? `${v}${f.unit}` : v);

// Human spec rows for the product page and compare table.
export function specRows(p: Product): [string, string][] {
  const def = catDef(p.category);
  const rows: [string, string | null][] = [["Brand", p.brand], ["Model number", p.modelNumber], ["Type", p.type]];
  if (p.category === "washers") {
    rows.push(
      ["Wash capacity", p.washCapacityKg ? `${p.washCapacityKg} kg` : null],
      ["Dry capacity", p.dryCapacityKg ? `${p.dryCapacityKg} kg` : null],
      ["Spin speed", p.spinRpm ? `${p.spinRpm} RPM` : null],
      ["Motor", p.washCapacityKg || p.dryCapacityKg ? p.motor : null],
      ["Features", p.features.length ? p.features.join(", ") : null],
    );
  }
  for (const s of def?.specs ?? []) {
    const v = p.specs[s.key];
    if (v) rows.push([s.label, s.unit ? `${v}${s.unit === "\"" ? "\"" : ` ${s.unit}`}` : v]);
  }
  rows.push(
    ["Energy rating", p.energyRating],
    ["Colour", p.colour],
    ["Dimensions (W × D × H)", p.dimensionsCm ? `${p.dimensionsCm} cm` : null],
    ["Weight", p.weightKg ? `${p.weightKg} kg` : null],
    ["Warranty", p.warranty],
  );
  return rows.filter((r): r is [string, string] => !!r[1]);
}

// Short line under the product name on cards.
export function keySpecs(p: Product): string {
  if (p.category === "washers") {
    const cap = p.washCapacityKg && p.dryCapacityKg ? `${p.washCapacityKg}/${p.dryCapacityKg}kg` : p.washCapacityKg ? `${p.washCapacityKg}kg` : p.dryCapacityKg ? `${p.dryCapacityKg}kg dry` : "";
    return [cap, p.energyRating ? `Energy ${p.energyRating}` : "", p.spinRpm ? `${p.spinRpm} RPM` : ""].filter(Boolean).join(" · ");
  }
  const def = catDef(p.category);
  return (def?.specs ?? [])
    .slice(0, 3)
    .map((s) => {
      const v = p.specs[s.key];
      if (!v || v === "No") return "";
      if (v === "Yes") return s.label;
      return s.unit ? `${v}${s.unit === "\"" ? "\"" : s.unit}` : v;
    })
    .filter(Boolean)
    .join(" · ");
}
