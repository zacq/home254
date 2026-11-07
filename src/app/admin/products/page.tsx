import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { activePrice, CATEGORY_LABEL } from "@/lib/format";
import { guard } from "@/lib/guard";
import { ensureSeed } from "@/lib/seed";
import { quickUpdateProduct, toggleArchive } from "../actions";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await guard("content");
  await ensureSeed();
  const sp = await searchParams;
  const rows = await db.select().from(products).orderBy(asc(products.archived), desc(products.popularity));
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
      <p className="text-sm text-slate-600">Quick-edit price, offer and stock right here. Open a product for the full spec template.</p>
      <ul className="grid gap-3">
        {rows.map((p) => (
          <li key={p.id} className={`card p-3 ${p.archived ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/products/${p.id}`} className="font-bold underline">{p.name}</Link>
              <span className="text-xs text-slate-500">{p.modelNumber} · {CATEGORY_LABEL[p.category] ?? p.category}{p.archived ? " · ARCHIVED" : ""}{activePrice(p).onOffer ? " · on offer" : ""}</span>
            </div>
            <form action={quickUpdateProduct} className="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <input type="hidden" name="id" value={p.id} />
              <div><label className="label" htmlFor={`pr-${p.id}`}>Price (KSh)</label><input id={`pr-${p.id}`} name="priceKsh" type="number" inputMode="numeric" defaultValue={p.priceKsh} className="input" /></div>
              <div><label className="label" htmlFor={`of-${p.id}`}>Offer price</label><input id={`of-${p.id}`} name="offerPriceKsh" type="number" inputMode="numeric" defaultValue={p.offerPriceKsh ?? ""} className="input" /></div>
              <div><label className="label" htmlFor={`oe-${p.id}`}>Offer ends</label><input id={`oe-${p.id}`} name="offerEnd" type="date" defaultValue={p.offerEnd?.toISOString().slice(0, 10) ?? ""} className="input" /></div>
              <div><label className="label" htmlFor={`st-${p.id}`}>Stock</label><input id={`st-${p.id}`} name="stockQty" type="number" inputMode="numeric" defaultValue={p.stockQty} className="input" /></div>
              <button className="btn btn-brand col-span-2 sm:col-span-1">Save</button>
            </form>
            <form action={toggleArchive} className="mt-1">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="archived" value={p.archived ? "1" : "0"} />
              <button className="text-xs font-semibold text-slate-600 underline">{p.archived ? "Restore" : "Archive"}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
