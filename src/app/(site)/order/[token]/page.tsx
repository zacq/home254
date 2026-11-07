import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications, orderItems, orders } from "@/db/schema";
import { PageHeader } from "@/components/Bits";
import { PurchaseTracker } from "@/components/PurchaseTracker";
import { ksh } from "@/lib/format";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = { title: "Your order", robots: { index: false, follow: false } };

async function submitCode(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{8,12}$/.test(code)) return;
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o || o.paymentMethod !== "mpesa" || o.status === "cancelled") return;
  await db.update(orders).set({ mpesaCode: code }).where(eq(orders.id, o.id));
  const s = await getSettings();
  await db.insert(notifications).values({
    audience: "admin",
    recipient: s.whatsapp,
    subject: `M-Pesa code received ${o.orderNumber}`,
    message: `${o.customerName} entered M-Pesa code ${code} for ${o.orderNumber} (${ksh(o.total)}). Please verify and confirm payment.`,
    refType: "order",
    refId: o.id,
  });
  revalidatePath(`/order/${token}`);
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o) notFound();
  const [items, s] = await Promise.all([db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id)), getSettings()]);
  const flow = ORDER_STATUSES.filter((x) => !["cancelled", "refunded"].includes(x.key) && !(o.paymentMethod === "pod" && x.key === "awaiting_payment"));
  const idx = flow.findIndex((x) => x.key === o.status);
  const paid = ["confirmed", "scheduled", "delivered"].includes(o.status);

  return (
    <>
      {sp.new === "1" && <PurchaseTracker orderNumber={o.orderNumber} value={o.total} />}
      <PageHeader title={sp.new === "1" ? "Thank you — order received!" : `Order ${o.orderNumber}`} intro={`Order number ${o.orderNumber} · placed ${o.createdAt.toLocaleDateString("en-KE", { dateStyle: "medium" })}`} />
      <div className="container-x grid gap-5 py-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-4">
          <section className="card p-4">
            <h2 className="text-lg font-bold">Status: {statusLabel(o.status)}</h2>
            <ol className="mt-3 grid gap-2 sm:grid-cols-5">
              {flow.map((x, n) => (
                <li key={x.key} className={`rounded-lg p-2 text-center text-xs font-semibold ${idx >= n && idx >= 0 ? "bg-brand text-white" : "bg-slate-100 text-slate-500"}`}>{x.label}</li>
              ))}
            </ol>
            {["cancelled", "refunded"].includes(o.status) && <p className="mt-3 font-semibold text-red-700">This order is {statusLabel(o.status).toLowerCase()}.</p>}
          </section>

          {o.paymentMethod === "mpesa" && !paid && o.status !== "cancelled" && (
            <section className="card border-2 border-emerald-600 p-4">
              <h2 className="text-lg font-bold">Pay with M-Pesa</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>Go to M-Pesa → Lipa na M-Pesa → <b>Buy Goods and Services</b></li>
                <li>Till number: <b className="text-lg">{s.tillNumber}</b> ({s.paymentLabel})</li>
                <li>Amount: <b>{ksh(o.depositRequired > 0 ? o.depositRequired : o.total)}</b>{o.depositRequired > 0 && ` (deposit; balance ${ksh(o.total - o.depositRequired)} on delivery)`}</li>
                <li>Reference / account: <b>{o.orderNumber}</b></li>
                <li>Enter the M-Pesa confirmation code below.</li>
              </ol>
              {o.mpesaCode ? (
                <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">✓ Code {o.mpesaCode} received. We&apos;ll confirm your payment shortly.</p>
              ) : (
                <form action={submitCode} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="token" value={o.token} />
                  <label className="sr-only" htmlFor="code">M-Pesa code</label>
                  <input id="code" name="code" required minLength={8} maxLength={12} placeholder="e.g. SGH7K2LMN9" className="input uppercase" autoComplete="off" />
                  <button className="btn btn-brand">Submit code</button>
                </form>
              )}
            </section>
          )}
          {o.paymentMethod === "pod" && o.status === "new" && (
            <section className="card p-4 text-sm">
              <h2 className="text-lg font-bold">Pay on Delivery</h2>
              <p className="mt-1">Our sales team will call you on {o.phone} to confirm your order. You&apos;ll pay via M-Pesa when the machine arrives.</p>
            </section>
          )}

          <section className="card p-4">
            <h2 className="text-lg font-bold">Items</h2>
            <ul className="mt-2 divide-y text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span>{i.qty} × {i.name} <span className="text-slate-500">({i.modelNumber})</span>{i.extendedWarranty ? " + extended warranty" : ""}{i.pedestal ? " + stand" : ""}</span>
                  <span className="font-semibold">{ksh((i.unitPrice + i.warrantyPrice + i.pedestalPrice) * i.qty)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="grid h-fit gap-4">
          <div className="card p-4 text-sm">
            <h2 className="text-lg font-bold">Receipt</h2>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{ksh(o.subtotal + o.addonsTotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryFee ? ksh(o.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between"><dt>Installation</dt><dd>{o.installation ? (o.installFee ? ksh(o.installFee) : "Free") : "No"}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base font-extrabold"><dt>Total</dt><dd>{ksh(o.total)}</dd></div>
            </dl>
            <p className="mt-3 text-slate-600">{o.customerName} · {o.phone}<br />{o.zoneName}<br />{o.address}{o.deliveryDate ? <><br />Preferred date: {o.deliveryDate}</> : null}</p>
            <p className="mt-2 text-slate-600">Payment: {o.paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}</p>
          </div>
          <a className="btn btn-wa" href={waLink(s.whatsapp, `Hi, I have a question about my order ${o.orderNumber}.`)} target="_blank" rel="noopener noreferrer">💬 Questions? WhatsApp us</a>
          <p className="text-xs text-slate-500">Keep this page&apos;s link — it&apos;s your private receipt.</p>
        </aside>
      </div>
    </>
  );
}
