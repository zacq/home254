import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Bits";
import { FilterPanel } from "@/components/FilterPanel";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { getContent } from "@/lib/content";
import { SECTIONS, type Section } from "@/lib/format";
import { applyFilters, parseFilters, productsForSection } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  const sec = SECTIONS[section as Section];
  if (!sec) return {};
  return { title: sec.metaTitle, description: sec.metaDesc, alternates: { canonical: `/${section}` } };
}

const WASHER_FEATURES = ["SpaCare steam wash", "Inverter motor", "Dryer function", "Auto-dose", "Microfiber catcher", "Baby care", "Drum clean", "Quick 15'"];
const FEATURE_OPTIONS: Partial<Record<Section, string[]>> = {
  "washing-machines": WASHER_FEATURES,
  combos: WASHER_FEATURES.filter((f) => f !== "Dryer function"),
  dryers: ["Heat pump", "Inverter motor", "Drum clean", "Quick 15'"],
};

export default async function SectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const sec = SECTIONS[section as Section];
  if (!sec) notFound();
  const sp = await searchParams;
  const [s, all, intros] = await Promise.all([getSettings(), productsForSection(section as Section), getContent("intros")]);
  const f = parseFilters(sp);
  const list = applyFilters(all, f);

  const types = [...new Set(all.map((p) => p.type))];
  const brands = [...new Set(all.map((p) => p.brand))];
  const isLaundry = section !== "other-appliances";
  // Active filters stay listed so a link from Technology Explained can be unticked.
  const featureOpts = isLaundry ? [...new Set([...(FEATURE_OPTIONS[section as Section] ?? []), ...f.features])] : [];
  const intro = intros.find((i) => i.section === section);

  return (
    <>
      <PageHeader title={sec.h1} intro={sec.metaDesc} />
      {intro && (
        <section className="container-x pt-5">
          <div className="card p-4">
            <h2 className="font-bold text-brand-dark">{intro.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {intro.points.split("\n").filter(Boolean).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <div className="container-x grid gap-5 py-5 lg:grid-cols-[17rem_1fr]">
        <aside>
          <FilterPanel count={list.length}>
            <form className="card grid gap-3 p-4" method="get">
              <div>
                <label className="label" htmlFor="sort">Sort by</label>
                <select id="sort" name="sort" defaultValue={f.sort} className="input">
                  <option value="popular">Popular</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              {types.length > 1 && (
                <fieldset>
                  <legend className="label">Type</legend>
                  {types.map((t) => (
                    <label key={t} className="flex min-h-11 items-center gap-2 text-sm">
                      <input type="checkbox" name="type" value={t} defaultChecked={f.types.includes(t)} className="h-5 w-5" /> {t}
                    </label>
                  ))}
                </fieldset>
              )}
              {isLaundry && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label" htmlFor="capMin">Min kg</label>
                    <select id="capMin" name="capMin" defaultValue={f.capMin ?? ""} className="input">
                      <option value="">Any</option>
                      {[7, 8, 9, 10, 11, 12].map((n) => <option key={n} value={n}>{n}kg</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="capMax">Max kg</label>
                    <select id="capMax" name="capMax" defaultValue={f.capMax ?? ""} className="input">
                      <option value="">Any</option>
                      {[8, 9, 10, 11, 12].map((n) => <option key={n} value={n}>{n}kg</option>)}
                    </select>
                  </div>
                </div>
              )}
              {featureOpts.length > 0 && (
                <fieldset>
                  <legend className="label">Features</legend>
                  {featureOpts.map((t) => (
                    <label key={t} className="flex min-h-11 items-center gap-2 text-sm">
                      <input type="checkbox" name="feature" value={t} defaultChecked={f.features.includes(t)} className="h-5 w-5" /> {t}
                    </label>
                  ))}
                </fieldset>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label" htmlFor="priceMin">Min KSh</label>
                  <input id="priceMin" name="priceMin" type="number" inputMode="numeric" step={1000} defaultValue={f.priceMin ?? ""} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="priceMax">Max KSh</label>
                  <input id="priceMax" name="priceMax" type="number" inputMode="numeric" step={1000} defaultValue={f.priceMax ?? ""} className="input" />
                </div>
              </div>
              {brands.length > 1 && (
                <div>
                  <label className="label" htmlFor="brand">Brand</label>
                  <select id="brand" name="brand" defaultValue={f.brand ?? ""} className="input">
                    <option value="">All brands</option>
                    {brands.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              )}
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="inStock" value="1" defaultChecked={f.inStock} className="h-5 w-5" /> In stock only
              </label>
              <button className="btn btn-brand">Apply filters</button>
              <Link href={`/${section}`} className="text-center text-sm font-semibold text-brand underline">Clear all</Link>
            </form>
          </FilterPanel>
        </aside>
        <div>
          <p className="mb-3 text-sm text-slate-600" aria-live="polite">{list.length} product{list.length === 1 ? "" : "s"}</p>
          {list.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="font-bold">No machines match those filters.</p>
              <p className="mt-1 text-sm text-slate-600">Loosen a filter, or tell us what you need and we&apos;ll suggest one.</p>
              <TrackedLink href={waLink(s.whatsapp, `Hi, I'm looking for a machine in ${sec.title} but couldn't find the right one.`)} event="whatsapp_click" external className="btn btn-wa mt-3">
                💬 Ask on WhatsApp
              </TrackedLink>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {list.map((p, i) => (
                <ProductCard key={p.id} p={p} whatsapp={s.whatsapp} priority={i < 2} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
