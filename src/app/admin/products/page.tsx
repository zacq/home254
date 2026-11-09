import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CATALOG, catDef } from "@/lib/catalog";
import { activePrice, isFlash } from "@/lib/format";
import { guard } from "@/lib/guard";
import { ensureSeed } from "@/lib/seed";
import { archiveSampleProducts, quickUpdateProduct, toggleArchive } from "../actions";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; category?: string; q?: string }> }) {
  const admin = await guard("content", "pricing");
  await ensureSeed();
  const sp = await searchParams;
  const all = await db.select().from(products).orderBy(asc(products.archived), asc(products.category), desc(products.popularity));
  const q = sp.q?.trim().toLowerCase();
  const rows = all.filter((p) => (!sp.category || p.category === sp.category) && (!q || `${p.name} ${p.modelNumber} ${p.brand}`.toLowerCase().includes(q)));
  const samples = all.filter((p) => p.isSample && !p.archived).length;
  const chip = (on: boolean) => `shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${on ? "bg-brand text-white" : "bg-white"}`;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary ml-auto">+ Add product</Link>
        <Link href="/admin/products/import" className="btn btn-outline">Import CSV</Link>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/api/admin/export/products" className="btn btn-outline">Export CSV</a>
      </div>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      {samples > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <span><b>{samples} sample products</b> are live so every category can be reviewed. Replace them with your real catalogue (CSV import is fastest), then archive the samples.</span>
          {admin.role === "owner" && (
            <form action={archiveSampleProducts}><button className="btn btn-outline !min-h-11 !text-sm">Archive all samples</button></form>
          )}
        </div>
      )}
      <form className="flex gap-2" method="get">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <label className="sr-only" htmlFor="q">Search products</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search name, model or brand" className="input" />
        <button className="btn btn-brand">Search</button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/products" className={chip(!sp.category)}>All ({all.length})</Link>
        {CATALOG.map((c) => <Link key={c.slug} href={`/admin/products?category=${c.slug}`} className={chip(sp.category === c.slug)}>{c.name}</Link>)}
      </div>
      <p className="text-sm text-slate-600">Quick-edit price, sale and stock here. Open a product for specs, pricing reference and flash sales. Prices below the category margin floor are refused.</p>
      <ul className="grid gap-3">
        {rows.map((p) => {
          const def = catDef(p.category);
          return (
            <li key={p.id} id={`p${p.id}`} className={`card p-3 ${p.archived ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/products/${p.id}`} className="font-bold underline">{p.name}</Link>
                <span className="text-xs text-slate-500">
                  {p.brand} · {p.modelNumber} · {def?.name ?? p.category} › {def?.subs.find((s) => s.slug === p.subcategory)?.name ?? (p.subcategory || "—")}
                  {p.archived ? " · ARCHIVED" : ""}
                  {activePrice(p).onOffer ? (isFlash(p) ? " · flash sale" : " · on sale") : ""}
                  {p.isSample ? " · SAMPLE" : ""}
                </span>
              </div>
              <form action={quickUpdateProduct} className="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <input type="hidden" name="id" value={p.id} />
                <div><label className="label" htmlFor={`pr-${p.id}`}>Price (KSh)</label><input id={`pr-${p.id}`} name="priceKsh" type="number" inputMode="numeric" defaultValue={p.priceKsh} className="input" /></div>
                <div><label className="label" htmlFor={`of-${p.id}`}>Sale price</label><input id={`of-${p.id}`} name="offerPriceKsh" type="number" inputMode="numeric" defaultValue={p.offerPriceKsh ?? ""} className="input" /></div>
                <div><label className="label" htmlFor={`oe-${p.id}`}>Sale ends</label><input id={`oe-${p.id}`} name="offerEnd" type="date" defaultValue={p.offerEnd?.toISOString().slice(0, 10) ?? ""} className="input" /></div>
                <div><label className="label" htmlFor={`st-${p.id}`}>Stock</label><input id={`st-${p.id}`} name="stockQty" type="number" inputMode="numeric" defaultValue={p.stockQty} className="input" /></div>
                <button className="btn btn-brand col-span-2 sm:col-span-1">Save</button>
              </form>
              {admin.role !== "pricing" && (
                <form action={toggleArchive} className="mt-1">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="archived" value={p.archived ? "1" : "0"} />
                  <button className="text-xs font-semibold text-slate-600 underline">{p.archived ? "Restore" : "Archive"}</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
