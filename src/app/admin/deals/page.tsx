import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { promoCodes, type PromoCode } from "@/db/schema";
import { isFlash, ksh, priceInfo } from "@/lib/format";
import { guard } from "@/lib/guard";
import { allProducts } from "@/lib/queries";
import { savePromo } from "../actions";

const day = (d: Date | null) => (d ? new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 10) : "");

function PromoForm({ p, products }: { p?: PromoCode; products: { id: number; name: string }[] }) {
  return (
    <form action={savePromo} className="card grid gap-2 p-3 sm:grid-cols-4 sm:items-end">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div><label className="label">Code</label><input name="code" required defaultValue={p?.code} className="input uppercase" /></div>
      <div>
        <label className="label">Type</label>
        <select name="kind" defaultValue={p?.kind ?? "amount"} className="input">
          <option value="amount">KSh off</option>
          <option value="percent">% off</option>
          <option value="price_match">Price match (sets the price)</option>
        </select>
      </div>
      <div><label className="label">Value</label><input name="value" type="number" required defaultValue={p?.value} className="input" /></div>
      <div><label className="label">Minimum order (KSh)</label><input name="minSubtotal" type="number" defaultValue={p?.minSubtotal ?? 0} className="input" /></div>
      <div>
        <label className="label">Only for product</label>
        <select name="productId" defaultValue={p?.productId ?? ""} className="input">
          <option value="">Any product</option>
          {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      <div><label className="label">Only for phone</label><input name="phone" defaultValue={p?.phone ?? ""} placeholder="07xx" className="input" /></div>
      <div><label className="label">Max uses</label><input name="maxUses" type="number" defaultValue={p?.maxUses ?? ""} placeholder="Unlimited" className="input" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Starts</label><input name="startsAt" type="date" defaultValue={day(p?.startsAt ?? null)} className="input" /></div>
        <div><label className="label">Ends</label><input name="endsAt" type="date" defaultValue={day(p?.endsAt ?? null)} className="input" /></div>
      </div>
      <div className="sm:col-span-3"><label className="label">Note</label><input name="note" defaultValue={p?.note ?? ""} className="input" /></div>
      <div className="flex items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} className="h-5 w-5" /> Active</label>
        <button className="btn btn-brand ml-auto">{p ? "Save" : "Create"}</button>
      </div>
      {p && <p className="text-xs text-slate-500 sm:col-span-4">Used {p.uses}{p.maxUses != null ? ` of ${p.maxUses}` : ""} times</p>}
    </form>
  );
}

export default async function AdminDeals({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guard("pricing");
  const sp = await searchParams;
  const [codes, all] = await Promise.all([db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt)).limit(100), allProducts()]);
  const onSale = all.filter((p) => priceInfo(p).onOffer);
  const opts = all.map((p) => ({ id: p.id, name: `${p.brand} ${p.modelNumber}` }));
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold text-brand-dark">Deals & promo codes</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <section className="card p-4">
        <h2 className="font-bold">Live sales and flash sales ({onSale.length})</h2>
        <p className="text-xs text-slate-500">Set sale prices, start and end times and flash-sale quantity caps on each product. Prices revert automatically at the end time or when the cap sells out.</p>
        <ul className="mt-2 divide-y text-sm">
          {onSale.map((p) => {
            const pi = priceInfo(p);
            return (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <Link href={`/admin/products/${p.id}`} className="underline">{p.brand} {p.modelNumber} · {p.name}</Link>
                <span>
                  {ksh(pi.price)} <span className="text-slate-500 line-through">{pi.was ? ksh(pi.was) : ""}</span> · −{pi.pct}%
                  {isFlash(p) ? ` · flash ${p.offerSold}/${p.offerQtyCap} sold` : ""}
                  {p.offerEnd ? ` · ends ${p.offerEnd.toLocaleString("en-KE")}` : " · no end date"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="grid gap-3">
        <h2 className="font-bold">Promo codes</h2>
        <p className="text-xs text-slate-500">One code per order. Price-match codes from Best Price Promise requests are created from the Leads page.</p>
        <PromoForm products={opts} />
        {codes.map((c) => <PromoForm key={c.id} p={c} products={opts} />)}
      </section>
      <p className="text-xs text-slate-500">Bundles and members-only prices are planned for Phase 2.</p>
    </div>
  );
}
