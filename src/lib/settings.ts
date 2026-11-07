import { cache } from "react";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const SETTING_DEFAULTS = {
  storeName: "Wash & Co. Appliances",
  tagline: "Premium laundry appliances, explained and delivered.",
  whatsapp: "254700000000",
  phoneDisplay: "+254 700 000 000",
  phoneTel: "+254700000000",
  email: "sales@example.co.ke",
  tillNumber: "123456",
  paymentLabel: "M-Pesa Buy Goods Till",
  showroomAddress: "Showroom address to be confirmed, Nairobi",
  openingHours: "Mon–Sat 8:30am–6:00pm · Sun 11:00am–4:00pm",
  mapQuery: "Nairobi, Kenya",
  podCap: "150000",
  depositThreshold: "200000",
  depositPct: "30",
  warrantyPct: "5",
  pedestalPrice: "0",
  financingRates: "",
  announcement: "Price confirmed on WhatsApp · Free delivery & installation in selected zones",
  dealerStatement:
    "We are an independent appliance retailer. Brand names are used to identify the products we sell. Warranty terms are stated precisely on every product page.",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  facebook: "https://facebook.com/",
} as const;

export type Settings = Record<keyof typeof SETTING_DEFAULTS, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await db.select().from(settings);
  } catch {
    rows = [];
  }
  const out: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in out) out[r.key] = r.value;
  return out as Settings;
});

export { waLink } from "@/lib/format";
