import { eq, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CategorySpecFields } from "@/components/admin/CategorySpecFields";
import { ImageField } from "@/components/admin/ImageField";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { floorPrice, suggestedPrice } from "@/lib/pricing";
import { marginFloorFor } from "@/lib/queries";
import { saveProduct } from "../../actions";

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
// datetime-local in Nairobi time (UTC+3).
const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 16) : "");

export default async function ProductForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await guard("content", "pricing");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  if (!isNew && !p) notFound();
  const extra = await db.select().from(categories).where(isNotNull(categories.parent));
  const floorPct = p ? await marginFloorFor(p.category) : null;
  const floor = p ? floorPrice(p.costKsh, floorPct) : null;
  const t = (k: string, label: string, v: string | number | null | undefined, extra: { type?: string; req?: boolean; hint?: string } = {}) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} name={k} type={extra.type ?? "text"} inputMode={extra.type === "number" ? "numeric" : undefined} required={extra.req} defaultValue={v ?? ""} className="input" />
      {extra.hint && <p className="mt-0.5 text-xs text-slate-500">{extra.hint}</p>}
    </div>
  );
  return (
    <form action={saveProduct} className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">{isNew ? "Add product" : `Edit: ${p!.name}`}</h1>
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      {p && <input type="hidden" name="id" value={p.id} />}
      <section className="card grid gap-3 p-4 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Basics</h2>
        {t("name", "Name", p?.name, { req: true })}
        {t("modelNumber", "Model number (unique)", p?.modelNumber, { req: true })}
        {t("brand", "Brand", p?.brand ?? "MIKA", { hint: "e.g. MIKA, LG, Samsung, Hisense, Ramtons, Von" })}
        {t("colour", "Colour", p?.colour)}
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured} className="h-5 w-5" /> Featured</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="archived" defaultChecked={p?.archived} className="h-5 w-5" /> Archived (hidden)</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="isSample" defaultChecked={p?.isSample} className="h-5 w-5" /> Sample listing (not a real product yet)</label>
        </div>
      </section>
      <CategorySpecFields
        catsub={p ? `${p.category}/${p.subcategory}` : ""}
        type={p?.type ?? ""}
        energyRating={p?.energyRating ?? ""}
        specs={p?.specs ?? {}}
        laundry={{ washCapacityKg: p?.washCapacityKg ?? null, dryCapacityKg: p?.dryCapacityKg ?? null, spinRpm: p?.spinRpm ?? null, motor: p?.motor ?? "Standard", features: p?.features ?? [] }}
        extraSubs={extra.map((c) => ({ parent: c.parent!, slug: c.slug.split("/")[1], name: c.name }))}
      />
      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-bold sm:col-span-2 lg:col-span-4">Pricing</h2>
        {t("priceKsh", "Our price (KSh)", p?.priceKsh, { type: "number", req: true })}
        {t("wasPriceKsh", "Was-price (KSh)", p?.wasPriceKsh, { type: "number", hint: "Only a genuine prior or recommended price" })}
        {t("costKsh", "Cost price (KSh)", p?.costKsh, { type: "number", hint: floor ? `Margin floor: ${ksh(floor)} (${floorPct}%)` : "Needed for the margin-floor check" })}
        <div />
        {t("competitorPriceKsh", "Competitor price (KSh)", p?.competitorPriceKsh, { type: "number", hint: p?.competitorPriceKsh ? `Suggested: ${ksh(suggestedPrice(p.competitorPriceKsh))}` : "Reference price for the pricing engine" })}
        {t("competitorWasKsh", "Competitor was-price (KSh)", p?.competitorWasKsh, { type: "number" })}
        {t("competitorCheckedAt", "Competitor price checked on", day(p?.competitorCheckedAt), { type: "date" })}
      </section>
      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-bold sm:col-span-2 lg:col-span-4">Sale / flash sale & stock</h2>
        {t("offerPriceKsh", "Sale price (KSh)", p?.offerPriceKsh, { type: "number", hint: "Leave blank for no sale" })}
        {t("offerStart", "Sale starts", local(p?.offerStart), { type: "datetime-local" })}
        {t("offerEnd", "Sale ends", local(p?.offerEnd), { type: "datetime-local", hint: "Real end time: the countdown uses it and the price reverts automatically" })}
        {t("offerQtyCap", "Flash-sale quantity cap", p?.offerQtyCap, { type: "number", hint: p?.offerQtyCap != null ? `${p.offerSold} sold so far` : "Set to make this a flash sale" })}
        {t("offerBadge", "Sale label", p?.offerBadge, { hint: "e.g. Black Friday" })}
        {t("stockQty", "Stock quantity", p?.stockQty ?? 0, { type: "number" })}
        {t("lowStockAt", "Low-stock alert at", p?.lowStockAt ?? 2, { type: "number" })}
      </section>
      <section className="card grid gap-3 p-4 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">More details</h2>
        {t("dimensionsCm", "Dimensions W × D × H (cm)", p?.dimensionsCm)}
        {t("weightKg", "Weight (kg)", p?.weightKg, { type: "number" })}
        <div className="sm:col-span-2">{t("warranty", "Warranty", p?.warranty, { hint: "e.g. 2-year general warranty" })}</div>
      </section>
      <section className="card grid gap-3 p-4">
        <h2 className="font-bold">Content & media</h2>
        {t("shortBenefit", "One-line benefit", p?.shortBenefit)}
        <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={5} defaultValue={p?.description} className="input" /></div>
        <div><p className="label">Photos (first is the main photo)</p><ImageField name="images" multiple value={p?.images ?? []} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {t("videoUrl", "Video link", p?.videoUrl)}
          {t("manualPdf", "Manual / brochure PDF link", p?.manualPdf)}
        </div>
      </section>
      <section className="card grid gap-3 p-4 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">SEO</h2>
        {t("slug", "URL slug", p?.slug, { hint: "Leave blank to auto-fill from name + model" })}
        {t("seoTitle", "SEO title", p?.seoTitle)}
        <div className="sm:col-span-2"><label className="label" htmlFor="metaDescription">Meta description</label><textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={p?.metaDescription ?? ""} className="input" /></div>
      </section>
      <div className="sticky bottom-0 -mx-3 bg-slate-100/95 p-3 sm:mx-0">
        <button className="btn btn-primary w-full sm:w-auto">Save product</button>
      </div>
    </form>
  );
}
