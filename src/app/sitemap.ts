import type { MetadataRoute } from "next";
import { productPath } from "@/lib/format";
import { allProducts, getCategoryTree } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const statics = [
    "", "/deals", "/rewards", "/best-price-promise", "/e-warranty", "/technology", "/which-machine", "/payment-options",
    "/delivery-warranty", "/showroom", "/about", "/contact", "/terms", "/privacy", "/returns",
  ];
  const [products, tree] = await Promise.all([allProducts().catch(() => []), getCategoryTree().catch(() => [])]);
  const cats = tree.flatMap((c) => [c.path, ...c.subs.filter((s) => s.visible).map((s) => s.path)]);
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...cats.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}${productPath(p)}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
