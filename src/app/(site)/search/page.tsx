import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { allProducts, getCategoryTree, searchProducts } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = { title: "Search products", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [s, all, tree] = await Promise.all([getSettings(), allProducts(), getCategoryTree()]);
  const results = searchProducts(all, q).slice(0, 96);
  const lower = q.trim().toLowerCase();
  const cats = lower
    ? tree.flatMap((c) => [{ name: c.name, path: c.path }, ...c.subs.filter((x) => x.visible).map((x) => ({ name: x.name, path: x.path }))]).filter((c) => c.name.toLowerCase().includes(lower))
    : [];
  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} intro="Search by product, brand, model number (e.g. MDRH3110DS), size (e.g. 55 inch) or capacity (e.g. 10kg)." />
      <div className="container-x py-6">
        {cats.length > 0 && (
          <p className="mb-4 flex flex-wrap gap-2 text-sm">
            <span className="font-semibold">Categories:</span>
            {cats.map((c) => <Link key={c.path} href={c.path} className="rounded-full bg-brand-light px-3 py-1 font-semibold text-brand-dark">{c.name}</Link>)}
          </p>
        )}
        {results.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-bold">{q ? "No products found." : "Type something in the search box above."}</p>
            <TrackedLink href={waLink(s.whatsapp, `Hi, I searched for "${q}" on your website. Can you help?`)} event="whatsapp_click" external className="btn btn-wa mt-3">
              💬 Ask us on WhatsApp
            </TrackedLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
