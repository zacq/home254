import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customers, orderItems, orders, reviews } from "@/db/schema";
import { PageHeader } from "@/components/Bits";
import { PurchaseTracker } from "@/components/PurchaseTracker";
import { getCustomer } from "@/lib/customer-auth";
import { ksh } from "@/lib/format";
import { queueMessage } from "@/lib/messages";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = { title: "Your order", robots: { index: false } };

async function submitCode(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{8,12}$/.test(code)) return;
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o || o.paymentMethod !== "mpesa" || o.status === "cancelled") return;
  await db.update(orders).set({ mpesaCode: code }).where(eq(orders.id, o.id));
  const s = await getSettings();
  await queueMessage({
    audience: "admin",
    recipient: s.whatsapp,
    subject: `M-Pesa code received ${o.orderNumber}`,
    message: `${o.customerName} entered M-Pesa code ${code} for ${o.orderNumber} (${ksh(o.total)}). Please verify and confirm payment.`,
    refType: "order",
    refId: o.id,
  });
  revalidatePath(`/order/${token}`);
}

// Only the buyer of a delivered order can review, which makes every review verified (PRD RV-1).
async function submitReview(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const productId = Number(formData.get("productId"));
  const rating = Math.min(5, Math.max(1, Math.round(Number(formData.get("rating")) || 0)));
  const body = String(formData.get("body") ?? "").trim().slice(0, 1500);
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o || o.status !== "delivered" || !rating || body.length < 5) redirect(`/order/${token}?review=invalid#review`);
  const [item] = await db.select().from(orderItems).where(and(eq(orderItems.orderId, o.id), eq(orderItems.productId, productId))).limit(1);
  if (!item) redirect(`/order/${token}#review`);
  const [dup] = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.orderId, o.id), eq(reviews.productId, productId))).limit(1);
  if (!dup) {
    const parts = o.customerName.trim().split(/\s+/);
    await db.insert(reviews).values({
      productId,
      orderId: o.id,
      customerId: o.customerId,
      name: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0],
      location: o.zoneName.split("—")[0].trim(),
      rating,
      body,
      verified: true,
      published: false, // moderation queue: staff can hide abusive text but never edit ratings
    });
  }
  redirect(`/order/${token}?review=thanks#review`);
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string; review?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o) notFound();
  const [items, s, member, myReviews, owner] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id)),
    getSettings(),
    getCustomer(),
    db.select({ productId: reviews.productId }).from(reviews).where(eq(reviews.orderId, o.id)),
    o.customerId ? db.select().from(customers).where(eq(customers.id, o.customerId)).limit(1) : Promise.resolve([]),
  ]);
  const joined = !!owner[0]?.joinedAt;
  const flow = ORDER_STATUSES.filter((x) => !["cancelled", "refunded"].includes(x.key) && !(o.paymentMethod === "pod" && x.key === "awaiting_payment"));
  const idx = flow.findIndex((x) => x.key === o.status);
  const paid = ["confirmed", "scheduled", "dispatched", "delivered"].includes(o.status);
  const reviewed = new Set(myReviews.map((r) => r.productId));
  const toReview = items.filter((i) => i.productId && !reviewed.has(i.productId));

  return (
    <>
      {sp.new === "1" && <PurchaseTracker orderNumber={o.orderNumber} value={o.total} />}
      <PageHeader title={sp.new === "1" ? "Thank you — order received!" : `Order ${o.orderNumber}`} intro={`Order number ${o.orderNumber} · placed ${o.createdAt.toLocaleDateString("en-KE", { dateStyle: "medium" })}`} />
      <div className="container-x grid gap-5 py-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid h-fit gap-4">
          <section className="card p-4">
            <h2 className="text-lg font-bold">Status: {statusLabel(o.status)}</h2>
            <ol className="mt-3 grid gap-2 sm:grid-cols-6">
              {flow.map((x, n) => (
                <li key={x.key} className={`rounded-lg p-2 text-center text-xs font-semibold ${idx >= n && idx >= 0 ? "bg-brand text-white" : "bg-slate-100 text-slate-500"}`}>{x.label}</li>
              ))}
            </ol>
            {["cancelled", "refunded"].includes(o.status) && <p className="mt-3 font-semibold text-red-700">This order is {statusLabel(o.status).toLowerCase()}. Points on it have been reversed.</p>}
            {o.status === "dispatched" && o.driverName && <p className="mt-3 rounded-lg bg-brand-light p-3 text-sm">Your driver: <b>{o.driverName}</b>{o.driverPhone && <> · <a className="font-semibold underline" href={`tel:${o.driverPhone}`}>{o.driverPhone}</a></>}</p>}
          </section>

          {o.pointsEarned > 0 && !["cancelled", "refunded"].includes(o.status) && (
            <section className="card border-2 border-amber-300 bg-amber-50/60 p-4">
              <h2 className="font-bold">⭐ {o.pointsEarned.toLocaleString()} points on this order</h2>
              {joined ? (
                <p className="mt-1 text-sm">{o.status === "delivered" ? "They are now in your balance." : "They become available when your order is delivered."} {member ? <Link href="/account" className="font-semibold text-brand underline">See my points</Link> : null}</p>
              ) : (
                <p className="mt-1 text-sm">
                  Join {s.rewardsName} with <b>+{o.phone}</b> to collect them, plus welcome points.{" "}
                  <Link href={`/account/sign-in?next=/order/${o.token}`} className="font-semibold text-brand underline">Join free</Link>
                </p>
              )}
            </section>
          )}

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
              <p className="mt-1">Our sales team will call you on +{o.phone} to confirm your order. You&apos;ll pay via M-Pesa when it arrives.</p>
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

          {o.status === "delivered" && (
            <section id="review" className="card scroll-mt-32 p-4">
              <h2 className="text-lg font-bold">Review your purchase</h2>
              {sp.review === "thanks" && <p role="status" className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Thank you! Your review will appear once our team has checked it.</p>}
              {sp.review === "invalid" && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">Please choose a star rating and write a few words.</p>}
              {toReview.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">You&apos;ve reviewed everything on this order.</p>
              ) : (
                toReview.map((i) => (
                  <form key={i.id} action={submitReview} className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3">
                    <input type="hidden" name="token" value={o.token} />
                    <input type="hidden" name="productId" value={i.productId!} />
                    <p className="font-semibold">{i.name}</p>
                    <fieldset className="flex gap-3">
                      <legend className="sr-only">Rating</legend>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <label key={n} className="flex min-h-11 items-center gap-1 text-sm"><input type="radio" name="rating" value={n} required className="h-5 w-5" /> {n}★</label>
                      ))}
                    </fieldset>
                    <label className="sr-only" htmlFor={`rv-${i.id}`}>Your review</label>
                    <textarea id={`rv-${i.id}`} name="body" rows={2} required minLength={5} placeholder="How is it working for you?" className="input" />
                    <button className="btn btn-brand w-fit">Submit review</button>
                  </form>
                ))
              )}
            </section>
          )}
        </div>
        <aside className="grid h-fit gap-4">
          <div className="card p-4 text-sm">
            <h2 className="text-lg font-bold">Receipt</h2>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{ksh(o.subtotal + o.addonsTotal)}</dd></div>
              {o.savings > 0 && <div className="flex justify-between text-emerald-700"><dt>You saved</dt><dd>{ksh(o.savings)}</dd></div>}
              {o.promoDiscount > 0 && <div className="flex justify-between text-emerald-700"><dt>Code {o.promoCode}</dt><dd>−{ksh(o.promoDiscount)}</dd></div>}
              {o.pointsRedeemed > 0 && <div className="flex justify-between text-emerald-700"><dt>Points used</dt><dd>−{ksh(o.pointsRedeemed)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryFee ? ksh(o.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between"><dt>Installation</dt><dd>{o.installation ? (o.installFee ? ksh(o.installFee) : "Free") : "No"}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base font-extrabold"><dt>Total</dt><dd>{ksh(o.total)}</dd></div>
            </dl>
            {o.installServices.length > 0 && <p className="mt-2 text-slate-600">Installation: {o.installServices.map((x) => x.name).join(", ")}</p>}
            <p className="mt-3 text-slate-600">{o.customerName} · +{o.phone}<br />{o.zoneName}<br />{o.address}{o.deliveryDate ? <><br />Preferred date: {o.deliveryDate}{o.deliverySlot ? `, ${o.deliverySlot}` : ""}</> : null}</p>
            <p className="mt-2 text-slate-600">Payment: {o.paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}</p>
          </div>
          <a className="btn btn-wa" href={waLink(s.whatsapp, `Hi, I have a question about my order ${o.orderNumber}.`)} target="_blank" rel="noopener noreferrer">💬 Questions? WhatsApp us</a>
          <Link href="/e-warranty#register" className="btn btn-outline">🛡️ Register warranty</Link>
          <p className="text-xs text-slate-500">Keep this page&apos;s link — it&apos;s your private receipt.</p>
        </aside>
      </div>
    </>
  );
}
