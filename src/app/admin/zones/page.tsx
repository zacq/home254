import { zones } from "@/lib/queries";
import { guard } from "@/lib/guard";
import { saveZone } from "../actions";
import type { DeliveryZone } from "@/db/schema";

function ZoneForm({ z }: { z?: DeliveryZone }) {
  return (
    <form action={saveZone} className="card grid gap-2 p-3 sm:grid-cols-[2fr_1fr_1fr_1.2fr_auto] sm:items-end">
      {z && <input type="hidden" name="id" value={z.id} />}
      <div><label className="label">Zone name</label><input name="name" required defaultValue={z?.name} className="input" /></div>
      <div><label className="label">Delivery fee</label><input name="fee" type="number" inputMode="numeric" defaultValue={z?.fee ?? 0} className="input" /></div>
      <div><label className="label">Install fee</label><input name="installFee" type="number" inputMode="numeric" defaultValue={z?.installFee ?? 0} className="input" /></div>
      <div><label className="label">Lead time</label><input name="leadTime" defaultValue={z?.leadTime ?? "1–2 days"} className="input" /></div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-5">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="podAllowed" defaultChecked={z?.podAllowed} className="h-5 w-5" /> Pay on Delivery allowed</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={z ? z.active : true} className="h-5 w-5" /> Active</label>
        <button className="btn btn-brand ml-auto">{z ? "Save" : "Add zone"}</button>
      </div>
    </form>
  );
}

export default async function AdminZones() {
  await guard("content");
  const list = await zones(false);
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Delivery zones</h1>
      {list.map((z) => <ZoneForm key={z.id} z={z} />)}
      <h2 className="mt-3 font-bold">Add a zone</h2>
      <ZoneForm />
    </div>
  );
}
