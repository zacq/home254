import { PageHeader } from "@/components/Bits";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { allProducts, searchProducts } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = { title: "Search products", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [s, all] = await Promise.all([getSettings(), allProducts()]);
  const results = searchProducts(all, q);
  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} intro="Search by product name, brand, model number (e.g. MWAFCV3310BDS) or capacity (e.g. 10kg)." />
      <div className="container-x py-6">
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
              <ProductCard key={p.id} p={p} whatsapp={s.whatsapp} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
