import { allProducts, zones } from "@/lib/queries";
import { ksh, activePrice } from "@/lib/format";
import { guard } from "@/lib/guard";
import { createManualOrder } from "../../actions";

export default async function NewOrder({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await guard("sales");
  const sp = await searchParams;
  const [ps, zs] = await Promise.all([allProducts(), zones()]);
  return (
    <form action={createManualOrder} className="card mx-auto grid max-w-2xl gap-3 p-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Create order (WhatsApp / phone)</h1>
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Customer name</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" required className="input" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <div>
          <label className="label" htmlFor="productId">Product</label>
          <select id="productId" name="productId" required className="input">
            {ps.map((p) => <option key={p.id} value={p.id}>{p.name} — {ksh(activePrice(p).price)} ({p.stockQty} in stock)</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="qty">Qty</label><input id="qty" name="qty" type="number" min={1} defaultValue={1} className="input" /></div>
      </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="paymentMethod">Payment</label><select id="paymentMethod" name="paymentMethod" className="input"><option value="mpesa">M-Pesa</option><option value="pod">Pay on Delivery</option></select></div>
        <label className="flex min-h-11 items-center gap-2 pt-5"><input type="checkbox" name="installation" defaultChecked className="h-5 w-5" /> Installation</label>
      </div>
      <div><label className="label" htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={2} className="input" /></div>
      <button className="btn btn-primary">Create order</button>
    </form>
  );
}
