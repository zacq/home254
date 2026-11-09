import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { auditLogs, notifications, orderItems, orders } from "@/db/schema";
import { PrintButton } from "@/components/PrintButton";
import { ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { DELIVERY_SLOTS, ORDER_STATUSES, statusLabel } from "@/lib/orders";
import { waLink } from "@/lib/settings";
import { updateOrderStatus } from "../../actions";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  await guard("sales", "fulfilment");
  const { id } = await params;
  const [o] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!o) notFound();
  const [items, msgs, logs] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    db.select().from(notifications).where(eq(notifications.refId, o.id)).orderBy(desc(notifications.createdAt)),
    db.select().from(auditLogs).where(eq(auditLogs.entityId, String(o.id))).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);
  const customerMsgs = msgs.filter((m) => m.audience === "customer" && m.refType === "order");
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark">{o.orderNumber}</h1>
        <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold">{statusLabel(o.status)}</span>
        <div className="ml-auto"><PrintButton /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 text-sm">
          <h2 className="font-bold">Customer & delivery</h2>
          <p className="mt-2">
            <b>{o.customerName}</b> · <a className="underline" href={`tel:+${o.phone}`}>+{o.phone}</a>{o.email ? ` · ${o.email}` : ""}
            {o.customerId && <> · <Link className="underline" href={`/admin/customers/${o.customerId}`}>customer profile</Link></>}
          </p>
          <p>{o.zoneName}<br />{o.address}</p>
          <p>Preferred: {o.deliveryDate || "any date"}{o.deliverySlot ? `, ${o.deliverySlot}` : ""}</p>
          {o.installServices.length > 0 && (
            <p className="mt-1 rounded bg-brand-light p-2"><b>Installation job:</b> {o.installServices.map((x) => `${x.name}${x.price ? ` (${ksh(x.price)})` : ""}`).join(", ")}</p>
          )}
          {o.notes && <p className="mt-1 rounded bg-amber-50 p-2">Notes: {o.notes}</p>}
          <p className="mt-2">Source: <b>{o.source}</b> · Payment: <b>{o.paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}</b> · M-Pesa code: <b>{o.mpesaCode || "—"}</b></p>
          {o.depositRequired > 0 && <p>Deposit requested: {ksh(o.depositRequired)}</p>}
          {o.driverName && <p>Driver: <b>{o.driverName}</b> {o.driverPhone}</p>}
          <h3 className="mt-3 font-bold">Items</h3>
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-1.5"><span>{i.qty} × {i.name} ({i.modelNumber}){i.extendedWarranty ? " + ext. warranty" : ""}{i.pedestal ? " + stand" : ""}</span><span>{ksh((i.unitPrice + i.warrantyPrice + i.pedestalPrice) * i.qty)}</span></li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between"><span>Delivery</span><span>{ksh(o.deliveryFee)}</span></p>
          <p className="flex justify-between"><span>Installation</span><span>{ksh(o.installFee)}</span></p>
          {o.promoDiscount > 0 && <p className="flex justify-between text-emerald-700"><span>Code {o.promoCode}</span><span>−{ksh(o.promoDiscount)}</span></p>}
          {o.pointsRedeemed > 0 && <p className="flex justify-between text-emerald-700"><span>Points used</span><span>−{ksh(o.pointsRedeemed)}</span></p>}
          <p className="flex justify-between border-t pt-1 text-base font-extrabold"><span>Total</span><span>{ksh(o.total)}</span></p>
          <p className="mt-1 text-xs text-slate-500">Points earned: {o.pointsEarned} (pending until delivered)</p>
          <p className="mt-3 hidden text-xs print:block">Customer signature: ______________________ &nbsp; Date: ____________</p>
        </section>
        <div className="grid h-fit gap-4 print:hidden">
          <form action={updateOrderStatus} className="card grid gap-3 p-4 sm:grid-cols-2">
            <h2 className="font-bold sm:col-span-2">Update order</h2>
            <input type="hidden" name="id" value={o.id} />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="status">Status (customer is messaged on change)</label>
              <select id="status" name="status" defaultValue={o.status} className="input">
                {ORDER_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Delivered makes the points available. Cancelled or Refunded reverses points and returns stock.</p>
            </div>
            <div><label className="label" htmlFor="mpesaCode">M-Pesa code</label><input id="mpesaCode" name="mpesaCode" defaultValue={o.mpesaCode ?? ""} className="input uppercase" /></div>
            <div><label className="label" htmlFor="deliveryDate">Delivery date</label><input id="deliveryDate" name="deliveryDate" type="date" defaultValue={o.deliveryDate ?? ""} className="input" /></div>
            <div>
              <label className="label" htmlFor="deliverySlot">Delivery slot</label>
              <select id="deliverySlot" name="deliverySlot" defaultValue={o.deliverySlot ?? ""} className="input">
                <option value="">—</option>
                {DELIVERY_SLOTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div />
            <div><label className="label" htmlFor="driverName">Driver name</label><input id="driverName" name="driverName" defaultValue={o.driverName ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="driverPhone">Driver phone</label><input id="driverPhone" name="driverPhone" type="tel" defaultValue={o.driverPhone ?? ""} className="input" /></div>
            <button className="btn btn-brand sm:col-span-2">Save</button>
          </form>
          <section className="card p-4 text-sm">
            <h2 className="font-bold">Customer messages</h2>
            <ul className="mt-2 divide-y">
              {customerMsgs.map((m) => (
                <li key={m.id} className="py-2">
                  <p className="font-semibold">{m.subject}</p>
                  <p className="text-slate-600">{m.message}</p>
                  <a className="text-xs font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(o.phone, m.message)}>Send on WhatsApp</a>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-4 text-sm">
            <h2 className="font-bold">History</h2>
            <ul className="mt-2 space-y-1">
              {logs.map((l) => (<li key={l.id} className="text-slate-600">{l.createdAt.toLocaleString("en-KE")} · {l.actor} · {l.action} {l.detail}</li>))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
