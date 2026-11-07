import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ImageField } from "@/components/admin/ImageField";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CATEGORY_LABEL, FEATURES, TYPES } from "@/lib/format";
import { guard } from "@/lib/guard";
import { saveProduct } from "../../actions";

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default async function ProductForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await guard("content");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  if (!isNew && !p) notFound();
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
        {t("brand", "Brand", p?.brand ?? "MIKA")}
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={p?.category ?? "washers"} className="input">
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={p?.type ?? "Front-load"} className="input">
            {TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        {t("colour", "Colour", p?.colour)}
        <div className="flex gap-6 sm:col-span-2">
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured} className="h-5 w-5" /> Featured on homepage</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="archived" defaultChecked={p?.archived} className="h-5 w-5" /> Archived (hidden)</label>
        </div>
      </section>
      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-bold sm:col-span-2 lg:col-span-4">Price, offer & stock</h2>
        {t("priceKsh", "Price (KSh)", p?.priceKsh, { type: "number", req: true })}
        {t("offerPriceKsh", "Offer price (KSh)", p?.offerPriceKsh, { type: "number" })}
        {t("offerStart", "Offer start", day(p?.offerStart), { type: "date" })}
        {t("offerEnd", "Offer end", day(p?.offerEnd), { type: "date" })}
        {t("offerBadge", "Offer badge text", p?.offerBadge, { hint: "e.g. Launch offer" })}
        {t("stockQty", "Stock quantity", p?.stockQty ?? 0, { type: "number" })}
        {t("lowStockAt", "Low-stock threshold", p?.lowStockAt ?? 2, { type: "number" })}
      </section>
      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-bold sm:col-span-2 lg:col-span-4">Specifications</h2>
        {t("washCapacityKg", "Wash capacity (kg)", p?.washCapacityKg, { type: "number" })}
        {t("dryCapacityKg", "Dry capacity (kg)", p?.dryCapacityKg, { type: "number" })}
        {t("spinRpm", "Spin (RPM)", p?.spinRpm, { type: "number" })}
        <div>
          <label className="label" htmlFor="energyRating">Energy rating</label>
          <select id="energyRating" name="energyRating" defaultValue={p?.energyRating ?? ""} className="input">
            <option value="">—</option>
            {["A+++", "A++", "A+", "A", "B", "C"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="motor">Motor</label>
          <select id="motor" name="motor" defaultValue={p?.motor ?? "Standard"} className="input">
            <option>Brushless inverter (BLDC)</option>
            <option>Standard</option>
          </select>
        </div>
        {t("dimensionsCm", "Dimensions W × D × H (cm)", p?.dimensionsCm)}
        {t("weightKg", "Weight (kg)", p?.weightKg, { type: "number" })}
        <div className="sm:col-span-2 lg:col-span-4">{t("warranty", "Warranty", p?.warranty, { hint: "e.g. 10-year motor warranty + 2-year general warranty" })}</div>
        <fieldset className="sm:col-span-2 lg:col-span-4">
          <legend className="label">Features</legend>
          <div className="flex flex-wrap gap-x-5">
            {FEATURES.map((f) => (
              <label key={f} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="features" value={f} defaultChecked={p?.features.includes(f)} className="h-5 w-5" /> {f}</label>
            ))}
          </div>
        </fieldset>
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
