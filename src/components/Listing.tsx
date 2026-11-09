import Image from "next/image";
import Link from "next/link";
import { FilterPanel, FilterTracker } from "@/components/FilterPanel";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import type { Product } from "@/db/schema";
import { filterLabel, type FilterDef } from "@/lib/catalog";
import { isRemoteImage, PAGE_SIZE } from "@/lib/format";
import { applyListing, facetCounts, getCardContext, parseListing, type MenuSub } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

type SP = Record<string, string | string[] | undefined>;

export function SubTileGrid({ subs }: { subs: MenuSub[] }) {
  if (!subs.length) return null;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {subs.map((s) => (
        <li key={s.path}>
          <Link href={s.path} className="card block h-full p-2 text-center hover:shadow-md">
            <Image src={s.image} alt="" width={96} height={96} unoptimized={isRemoteImage(s.image)} className="mx-auto h-16 w-16 object-contain" />
            <span className="mt-1 block text-xs font-semibold leading-tight">{s.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const pageHref = (base: string, sp: SP, page: number) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v == null) continue;
    for (const x of Array.isArray(v) ? v : [v]) q.append(k, x);
  }
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
};

// Filter panel with option counts, sort and a paginated grid of 24 (PRD FR-13, FR-14, NF-3).
export async function Listing({ products, filters, basePath, sp, emptyLabel }: { products: Product[]; filters: FilterDef[]; basePath: string; sp: SP; emptyLabel: string }) {
  const [s, ctx] = await Promise.all([getSettings(), getCardContext()]);
  const q = parseListing(sp, filters);
  const list = applyListing(products, filters, q, ctx);
  const facets = facetCounts(products, filters, q);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = Object.keys(q.sel).length + (q.priceMin || q.priceMax ? 1 : 0) + (q.inStock ? 1 : 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
      <FilterTracker active={active} />
      <aside>
        <FilterPanel count={list.length} active={active}>
          <form className="card grid gap-3 p-4" method="get" action={basePath}>
            <div>
              <label className="label" htmlFor="sort">Sort by</label>
              <select id="sort" name="sort" defaultValue={q.sort} className="input">
                <option value="popular">Most popular</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="discount">Biggest discount</option>
                <option value="points">Most points</option>
              </select>
            </div>
            {facets.map(({ f, values }) => (
              <fieldset key={f.key}>
                <legend className="label">{f.label}</legend>
                {values.map(([v, n]) => (
                  <label key={v} className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name={f.key} value={v} defaultChecked={q.sel[f.key]?.includes(v)} className="h-5 w-5" />
                    {f.kind === "bool" ? "Yes" : filterLabel(f, v)} <span className="text-slate-500">({n})</span>
                  </label>
                ))}
              </fieldset>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="priceMin">Min KSh</label>
                <input id="priceMin" name="priceMin" type="number" inputMode="numeric" step={500} defaultValue={q.priceMin ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="priceMax">Max KSh</label>
                <input id="priceMax" name="priceMax" type="number" inputMode="numeric" step={500} defaultValue={q.priceMax ?? ""} className="input" />
              </div>
            </div>
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="inStock" value="1" defaultChecked={q.inStock} className="h-5 w-5" /> In stock only
            </label>
            <button className="btn btn-brand">Apply filters</button>
            {active > 0 && <Link href={basePath} className="text-center text-sm font-semibold text-brand underline">Clear all</Link>}
          </form>
        </FilterPanel>
      </aside>
      <div>
        <p className="mb-3 text-sm text-slate-600" aria-live="polite">
          {list.length} product{list.length === 1 ? "" : "s"}{pages > 1 ? ` · page ${page} of ${pages}` : ""}
        </p>
        {list.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-bold">No products match those filters.</p>
            <p className="mt-1 text-sm text-slate-600">Loosen a filter, or tell us what you need and we&apos;ll find it.</p>
            <TrackedLink href={waLink(s.whatsapp, `Hi, I'm looking for ${emptyLabel} but couldn't find the right one.`)} event="whatsapp_click" external className="btn btn-wa mt-3">
              💬 Ask on WhatsApp
            </TrackedLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {shown.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 2} />
            ))}
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-5 flex flex-wrap justify-center gap-2">
            {page > 1 && <Link className="btn btn-outline" href={pageHref(basePath, sp, page - 1)} rel="prev">← Previous</Link>}
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={pageHref(basePath, sp, n)} aria-current={n === page ? "page" : undefined} className={`btn !min-w-11 !px-3 ${n === page ? "btn-brand" : "btn-outline"}`}>{n}</Link>
            ))}
            {page < pages && <Link className="btn btn-outline" href={pageHref(basePath, sp, page + 1)} rel="next">Next →</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}
