import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { Countdown } from "@/components/Countdown";
import { ProductCard } from "@/components/ProductCard";
import { priceInfo } from "@/lib/format";
import { allProducts, flashProducts, getCategoryTree, onOfferProducts } from "@/lib/queries";

export const metadata = {
  title: "Deals & Flash Sales on Appliances in Kenya",
  description: "Every appliance on sale right now: TVs, fridges, washers, cookers and more, with real end dates, genuine was-prices and points on top.",
  alternates: { canonical: "/deals" },
};

const MIN_OPTIONS = [10, 20, 30, 50];

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ category?: string; min?: string }> }) {
  const sp = await searchParams;
  const [all, tree] = await Promise.all([allProducts(), getCategoryTree()]);
  const min = MIN_OPTIONS.includes(Number(sp.min)) ? Number(sp.min) : 0;
  const flash = flashProducts(all).filter((p) => p.stockQty > 0);
  const deals = onOfferProducts(all)
    .filter((p) => (!sp.category || p.category === sp.category) && priceInfo(p).pct >= min)
    .sort((a, b) => priceInfo(b).pct - priceInfo(a).pct);
  const cats = tree.filter((c) => onOfferProducts(all).some((p) => p.category === c.slug));
  const href = (category?: string, m?: number) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (m) q.set("min", String(m));
    const s = q.toString();
    return s ? `/deals?${s}` : "/deals";
  };
  const chip = (on: boolean) => `shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${on ? "bg-red-600 text-white" : "bg-white ring-1 ring-slate-200"}`;

  return (
    <>
      <PageHeader title="Deals" intro="Every sale price here has a genuine was-price and a real end date. You still earn points on top." />
      <div className="container-x grid gap-6 py-6">
        {flash.length > 0 && (
          <section aria-labelledby="flash-h">
            <h2 id="flash-h" className="mb-3 text-xl font-extrabold text-red-700">⚡ Flash sales</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {flash.map((p) => (
                <div key={p.id} className="grid gap-1">
                  {p.offerEnd && <Countdown end={p.offerEnd.toISOString()} className="rounded-lg bg-red-600 px-2 py-1 text-center text-xs font-bold text-white" />}
                  <ProductCard p={p} />
                  <p className="text-center text-xs font-semibold text-red-700">{Math.max(0, (p.offerQtyCap ?? 0) - p.offerSold)} left at this price</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="deals-h">
          <h2 id="deals-h" className="sr-only">All deals</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href={href(undefined, min)} className={chip(!sp.category)}>All categories</Link>
            {cats.map((c) => <Link key={c.slug} href={href(c.slug, min)} className={chip(sp.category === c.slug)}>{c.name}</Link>)}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <Link href={href(sp.category)} className={chip(!min)}>Any discount</Link>
            {MIN_OPTIONS.map((m) => <Link key={m} href={href(sp.category, m)} className={chip(min === m)}>{m}%+ off</Link>)}
          </div>
          <p className="my-3 text-sm text-slate-600">{deals.length} deal{deals.length === 1 ? "" : "s"}</p>
          {deals.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {deals.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <p className="card p-6 text-center text-slate-600">No deals match. Try another category or a smaller discount.</p>
          )}
        </section>
      </div>
    </>
  );
}
