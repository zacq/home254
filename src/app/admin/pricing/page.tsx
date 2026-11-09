import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { catDef } from "@/lib/catalog";
import { activePrice, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { priceCheck, STALE_DAYS } from "@/lib/pricing";
import { getCategoryTree } from "@/lib/queries";
import { savePricing } from "../actions";

const VIEWS = [
  ["review", "Weekly review list"],
  ["tracked", "All tracked"],
  ["untracked", "No competitor price yet"],
] as const;

export default async function AdminPricing({ searchParams }: { searchParams: Promise<{ view?: string; saved?: string; error?: string; category?: string }> }) {
  await guard("pricing");
  const sp = await searchParams;
  const view = VIEWS.some(([k]) => k === sp.view) ? sp.view! : "review";
  const [rows, tree] = await Promise.all([db.select().from(products).orderBy(asc(products.category), asc(products.name)), getCategoryTree(true)]);
  const floorPct = new Map(tree.map((c) => [c.slug, c.marginFloorPct]));
  const live = rows.filter((p) => !p.archived && (!sp.category || p.category === sp.category));
  const checked = live.map((p) => ({ p, c: priceCheck(p, floorPct.get(p.category)) }));
  const list = checked.filter(({ p, c }) => (view === "review" ? c.needsReview : view === "tracked" ? p.competitorPriceKsh != null : p.competitorPriceKsh == null));
  const tracked = checked.filter(({ p }) => p.competitorPriceKsh != null);
  const atOrBelow = tracked.filter(({ c }) => !c.aboveCompetitor).length;
  const ret = `/admin/pricing?view=${view}${sp.category ? `&category=${sp.category}` : ""}`;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Pricing engine</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Price position</p><p className="text-2xl font-extrabold text-brand-dark">{tracked.length ? Math.round((atOrBelow / tracked.length) * 100) : 0}%</p><p className="text-xs text-slate-500">tracked products at or below competitor (target 95%+)</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Needs review</p><p className="text-2xl font-extrabold text-red-700">{checked.filter(({ c }) => c.needsReview).length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Tracked</p><p className="text-2xl font-extrabold text-brand-dark">{tracked.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Missing cost price</p><p className="text-2xl font-extrabold text-amber-700">{live.filter((p) => p.costKsh == null).length}</p></div>
      </div>
      <p className="text-sm text-slate-600">
        The review list shows products priced above the competitor, below the margin floor, or with a competitor price older than {STALE_DAYS} days. Suggested price: over KSh 50,000 about KSh 2,000 below (ending …995/…495); KSh 5,000–50,000 about 3% below (ending …95); under KSh 5,000 about 4.5% below. It never goes below the margin floor. The site never names a competitor.
      </p>
      <div className="flex flex-wrap gap-2">
        {VIEWS.map(([k, l]) => <Link key={k} href={`/admin/pricing?view=${k}${sp.category ? `&category=${sp.category}` : ""}`} className={`rounded-full px-3 py-2 text-sm font-semibold ${view === k ? "bg-brand text-white" : "bg-white"}`}>{l}</Link>)}
        <form method="get" className="ml-auto flex gap-2">
          <input type="hidden" name="view" value={view} />
          <select name="category" defaultValue={sp.category ?? ""} className="input !w-auto" aria-label="Category">
            <option value="">All categories</option>
            {tree.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button className="btn btn-outline">Filter</button>
        </form>
      </div>
      <ul className="grid gap-3">
        {list.length === 0 && <li className="card p-4 text-slate-500">Nothing here. {view === "review" ? "All tracked prices are competitive and up to date." : ""}</li>}
        {list.map(({ p, c }) => (
          <li key={p.id} id={`p${p.id}`} className="card scroll-mt-32 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/admin/products/${p.id}`} className="font-bold underline">{p.brand} {p.modelNumber}</Link>
              <span className="text-slate-500">{p.name} · {catDef(p.category)?.name}</span>
              {c.aboveCompetitor && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">Above competitor</span>}
              {c.belowFloor && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">Below margin floor</span>}
              {c.stale && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Reference {p.competitorCheckedAt ? `checked ${p.competitorCheckedAt.toLocaleDateString("en-KE")}` : "never checked"}</span>}
              <span className="ml-auto text-xs text-slate-500">Live price {ksh(activePrice(p).price)}</span>
            </div>
            <form action={savePricing} className="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,1fr)_auto]">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="returnTo" value={ret} />
              <div><label className="label" htmlFor={`cp${p.id}`}>Competitor price</label><input id={`cp${p.id}`} name="competitorPriceKsh" type="number" inputMode="numeric" defaultValue={p.competitorPriceKsh ?? ""} className="input" /></div>
              <div><label className="label" htmlFor={`cw${p.id}`}>Competitor was</label><input id={`cw${p.id}`} name="competitorWasKsh" type="number" inputMode="numeric" defaultValue={p.competitorWasKsh ?? ""} className="input" /></div>
              <div><label className="label" htmlFor={`co${p.id}`}>Cost</label><input id={`co${p.id}`} name="costKsh" type="number" inputMode="numeric" defaultValue={p.costKsh ?? ""} className="input" /></div>
              <div>
                <label className="label" htmlFor={`pr${p.id}`}>Our price</label>
                <input id={`pr${p.id}`} name="priceKsh" type="number" inputMode="numeric" defaultValue={p.priceKsh} className="input" />
                <p className="text-xs text-slate-500">{c.suggested ? `Suggested ${ksh(c.suggested)}` : "Add a competitor price"}{c.floor ? ` · floor ${ksh(c.floor)}` : ""}</p>
              </div>
              <div><label className="label" htmlFor={`wp${p.id}`}>Our was-price</label><input id={`wp${p.id}`} name="wasPriceKsh" type="number" inputMode="numeric" defaultValue={p.wasPriceKsh ?? ""} className="input" /></div>
              <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-3 lg:col-span-1">
                <button className="btn btn-brand !min-h-11">Save</button>
                {c.suggested && <button name="useSuggested" value="1" className="btn btn-outline !min-h-11">Use suggested</button>}
                {p.competitorPriceKsh != null && <button name="markChecked" value="1" className="btn btn-outline !min-h-11">Still correct</button>}
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
