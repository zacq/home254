import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Bits";
import { Listing } from "@/components/Listing";
import { LEGACY_SECTIONS } from "@/lib/catalog";
import { productPath } from "@/lib/format";
import { allProducts, findCategory, productBySlug } from "@/lib/queries";

type Props = {
  params: Promise<{ cat: string; sub: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolve(cat: string, sub: string) {
  const c = await findCategory(cat);
  const s = c?.subs.find((x) => x.slug === sub && x.active);
  return c && s ? { c, s } : null;
}

export async function generateMetadata({ params }: Props) {
  const { cat, sub } = await params;
  const r = await resolve(cat, sub);
  if (!r) return {};
  return {
    title: `${r.s.name} Price in Kenya`,
    description: r.s.intro || `${r.s.name} in Kenya at or below the market price, with points on every purchase. ${r.c.def.metaDesc}`,
    alternates: { canonical: r.s.path },
  };
}

export default async function SubCategoryPage({ params, searchParams }: Props) {
  const { cat, sub } = await params;
  // v1 product URLs (/washing-machines/<slug>) move to their v2 address (PRD MG-3).
  if (LEGACY_SECTIONS[cat]) {
    const p = await productBySlug(sub);
    if (p) permanentRedirect(productPath(p));
    notFound();
  }
  const r = await resolve(cat, sub);
  if (!r) {
    const p = await productBySlug(sub);
    if (p) permanentRedirect(productPath(p));
    notFound();
  }
  const { c, s } = r;
  const [sp, all] = await Promise.all([searchParams, allProducts()]);
  const products = all.filter((p) => p.category === c.slug && p.subcategory === s.slug);
  return (
    <div className="container-x py-4">
      <Breadcrumbs items={[["Home", "/"], [c.name, c.path], [s.name, s.path]]} />
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{s.name}</h1>
      {s.intro && <p className="mt-2 max-w-3xl text-sm text-slate-700">{s.intro}</p>}
      <div className="mt-5">
        <Listing products={products} filters={c.def.filters} basePath={s.path} sp={sp} emptyLabel={s.name.toLowerCase()} />
      </div>
    </div>
  );
}
