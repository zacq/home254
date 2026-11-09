import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Bits";
import { Listing, SubTileGrid } from "@/components/Listing";
import { LEGACY_SECTIONS } from "@/lib/catalog";
import { allProducts, findCategory } from "@/lib/queries";

type Props = {
  params: Promise<{ cat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { cat } = await params;
  const c = await findCategory(cat);
  if (!c) return {};
  return { title: { absolute: c.def.metaTitle }, description: c.intro || c.def.metaDesc, alternates: { canonical: c.path } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { cat } = await params;
  if (LEGACY_SECTIONS[cat]) permanentRedirect(LEGACY_SECTIONS[cat]);
  const c = await findCategory(cat);
  if (!c) notFound();
  const [sp, all] = await Promise.all([searchParams, allProducts()]);
  const products = all.filter((p) => p.category === c.slug);
  return (
    <div className="container-x py-4">
      <Breadcrumbs items={[["Home", "/"], [c.name, c.path]]} />
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{c.def.h1}</h1>
      {c.intro && <p className="mt-2 max-w-3xl text-sm text-slate-700">{c.intro}</p>}
      <div className="my-5"><SubTileGrid subs={c.subs.filter((s) => s.visible)} /></div>
      <Listing products={products} filters={c.def.filters} basePath={c.path} sp={sp} emptyLabel={c.name.toLowerCase()} />
    </div>
  );
}
