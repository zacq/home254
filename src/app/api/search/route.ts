import { activePrice, productImage, productPath } from "@/lib/format";
import { allProducts, getCategoryTree, searchProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Header autocomplete: products (name, brand, model number) plus matching categories and brands.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return Response.json({ products: [], categories: [], brands: [] });
  const [all, tree] = await Promise.all([allProducts(), getCategoryTree()]);
  const lower = q.toLowerCase();
  const products = searchProducts(all, q)
    .slice(0, 6)
    .map((p) => ({ name: p.name, model: p.modelNumber, path: productPath(p), price: activePrice(p).price, image: productImage(p) }));
  const categories = tree
    .flatMap((c) => [{ name: c.name, path: c.path }, ...c.subs.filter((s) => s.visible).map((s) => ({ name: `${s.name} · ${c.name}`, path: s.path }))])
    .filter((c) => c.name.toLowerCase().includes(lower))
    .slice(0, 4);
  const brands = [...new Set(all.map((p) => p.brand))].filter((b) => b.toLowerCase().startsWith(lower)).slice(0, 3);
  return Response.json({ products, categories, brands });
}
