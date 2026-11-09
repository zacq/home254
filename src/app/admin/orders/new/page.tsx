import { activePrice, ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { allProducts, getInstallServices, zones } from "@/lib/queries";
import { createManualOrder } from "../../actions";

export default async function NewOrder({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await guard("sales");
  const sp = await searchParams;
  const [ps, zs, services] = await Promise.all([allProducts(), zones(), getInstallServices()]);
  const productSelect = (n: number) => (
    <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
      <div>
        <label className="label" htmlFor={`productId${n}`}>{n === 0 ? "Product" : `Extra product ${n} (optional)`}</label>
        <select id={`productId${n}`} name="productId" required={n === 0} defaultValue="" className="input">
          <option value="">{n === 0 ? "Choose…" : "—"}</option>
          {ps.map((p) => <option key={p.id} value={p.id}>{p.brand} {p.modelNumber} — {ksh(activePrice(p).price)} ({p.stockQty} in stock)</option>)}
        </select>
      </div>
      <div><label className="label" htmlFor={`qty${n}`}>Qty</label><input id={`qty${n}`} name="qty" type="number" min={1} defaultValue={1} className="input" /></div>
    </div>
  );
  return (
    <form action={createManualOrder} className="card mx-auto grid max-w-2xl gap-3 p-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Create order (WhatsApp / phone)</h1>
      <p className="text-sm text-slate-600">The order is linked to the customer&apos;s phone number, so they earn points as normal and can join Rewards later to collect them.</p>
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Customer name</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" required className="input" /></div>
      </div>
      {productSelect(0)}
      {productSelect(1)}
      {productSelect(2)}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="zoneId">Delivery zone</label>
          <select id="zoneId" name="zoneId" required className="input">{zs.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
        </div>
        <div>
          <label className="label" htmlFor="source">Source</label>
          <select id="source" name="source" className="input"><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option><option value="showroom">Showroom</option><option value="financing">Financing</option></select>
        </div>
      </div>
      <div><label className="label" htmlFor="address">Address / landmark</label><textarea id="address" name="address" rows={2} required className="input" /></div>
      <fieldset>
        <legend className="label">Installation (only services for the products above are charged)</legend>
        <div className="flex flex-wrap gap-x-5">
          {services.map((s) => (
            <label key={s.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="installIds" value={s.id} className="h-5 w-5" /> {s.name} ({s.price ? ksh(s.price) : "free"})</label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="paymentMethod">Payment</label><select id="paymentMethod" name="paymentMethod" className="input"><option value="mpesa">M-Pesa</option><option value="pod">Pay on Delivery</option></select></div>
        <div><label className="label" htmlFor="promoCode">Promo / price code</label><input id="promoCode" name="promoCode" className="input uppercase" /></div>
      </div>
      <div><label className="label" htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={2} className="input" /></div>
      <button className="btn btn-primary">Create order</button>
    </form>
  );
}
