import type { DeliveryZone, InstallService } from "@/db/schema";
import { CATALOG } from "@/lib/catalog";
import { guard } from "@/lib/guard";
import { getInstallServices, zones } from "@/lib/queries";
import { saveInstallService, saveZone } from "../actions";

function ZoneForm({ z }: { z?: DeliveryZone }) {
  return (
    <form action={saveZone} className="card grid gap-2 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] sm:items-end">
      {z && <input type="hidden" name="id" value={z.id} />}
      <div><label className="label">Zone name</label><input name="name" required defaultValue={z?.name} className="input" /></div>
      <div><label className="label">Delivery fee</label><input name="fee" type="number" inputMode="numeric" defaultValue={z?.fee ?? 0} className="input" /></div>
      <div><label className="label">Free above (KSh)</label><input name="freeAbove" type="number" inputMode="numeric" defaultValue={z?.freeAbove ?? ""} placeholder="Never" className="input" /></div>
      <div><label className="label">Install surcharge</label><input name="installFee" type="number" inputMode="numeric" defaultValue={z?.installFee ?? 0} className="input" /></div>
      <div><label className="label">Lead time</label><input name="leadTime" defaultValue={z?.leadTime ?? "1–2 days"} className="input" /></div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-5">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="goldFree" defaultChecked={z?.goldFree} className="h-5 w-5" /> Free for Gold members</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="podAllowed" defaultChecked={z?.podAllowed} className="h-5 w-5" /> Pay on Delivery allowed</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={z ? z.active : true} className="h-5 w-5" /> Active</label>
        <button className="btn btn-brand ml-auto">{z ? "Save" : "Add zone"}</button>
      </div>
    </form>
  );
}

function ServiceForm({ s }: { s?: InstallService }) {
  return (
    <form action={saveInstallService} className="card grid gap-2 p-3 sm:grid-cols-[2fr_1.2fr_1fr_auto_auto] sm:items-end">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div><label className="label">Service</label><input name="name" required defaultValue={s?.name} placeholder="e.g. TV wall mounting" className="input" /></div>
      <div>
        <label className="label">Offered with</label>
        <select name="category" defaultValue={s?.category ?? "washers"} className="input">{CATALOG.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      </div>
      <div><label className="label">Price (KSh)</label><input name="price" type="number" inputMode="numeric" defaultValue={s?.price ?? 0} className="input" /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s ? s.active : true} className="h-5 w-5" /> Active</label>
      <button className="btn btn-brand">{s ? "Save" : "Add"}</button>
    </form>
  );
}

export default async function AdminZones() {
  await guard("content");
  const [list, services] = await Promise.all([zones(false), getInstallServices(false)]);
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Delivery zones</h1>
      <p className="text-sm text-slate-600">Gold members get free delivery in zones marked for Gold; Platinum members get free delivery in every zone. The install surcharge is added once per order when installation is chosen.</p>
      {list.map((z) => <ZoneForm key={z.id} z={z} />)}
      <h2 className="mt-3 font-bold">Add a zone</h2>
      <ZoneForm />
      <h2 className="mt-6 text-xl font-extrabold text-brand-dark">Installation price list</h2>
      <p className="text-sm text-slate-600">Shown on product pages and offered at checkout for products in the matching category. The starting prices are placeholders: set your real ones.</p>
      {services.map((s) => <ServiceForm key={s.id} s={s} />)}
      <ServiceForm />
    </div>
  );
}
