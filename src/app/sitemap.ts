import type { MetadataRoute } from "next";
import { productPath } from "@/lib/format";
import { allProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const statics = [
    "", "/washing-machines", "/combos", "/dryers", "/other-appliances", "/technology", "/which-machine", "/payment-options",
    "/delivery-warranty", "/showroom", "/about", "/contact", "/terms", "/privacy", "/returns",
  ];
  const products = await allProducts().catch(() => []);
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}${productPath(p)}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
