"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { RewardsPanel, useQuote, useZone, type ZoneLite } from "@/components/CartView";
import { track } from "@/lib/analytics";
import { ksh } from "@/lib/format";

export function CheckoutForm({ zones, slots, member }: { zones: ZoneLite[]; slots: string[]; member: { name: string; phone: string; email: string } | null }) {
  const { items, ready, clear } = useCart();
  const router = useRouter();
  const [zoneId, setZoneId] = useZone();
  const [installIds, setInstallIds] = useState<number[]>([]);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [phone, setPhone] = useState(member?.phone ? `0${member.phone.slice(3)}` : "");
  const [pay, setPay] = useState<"mpesa" | "pod">("mpesa");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tracked = useRef(false);
  const { q, loading } = useQuote(items, ready, { zoneId, installIds, promoCode, usePoints, phone });

  useEffect(() => {
    if (ready && items.length && !tracked.current) {
      tracked.current = true;
      track("begin_checkout", { value: items.reduce((n, i) => n + i.price * i.qty, 0) });
    }
  }, [ready, items]);

  if (!ready) return <p className="container-x py-10">Loading…</p>;
  if (!items.length)
    return (
      <div className="container-x py-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link href="/deals" className="btn btn-primary mt-4">See today&apos;s deals</Link>
      </div>
    );

  const effectivePay = pay === "pod" && !q?.podOk ? "mpesa" : pay;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone,
          email: fd.get("email"),
          zoneId,
          address: fd.get("address"),
          deliveryDate: fd.get("deliveryDate"),
          deliverySlot: fd.get("deliverySlot"),
          installIds,
          promoCode,
          usePoints,
          notes: fd.get("notes"),
          paymentMethod: effectivePay,
          website: fd.get("website"),
          terms: fd.get("terms") === "on",
          marketingConsent: fd.get("marketing") === "on",
          lines: items.map((i) => ({ productId: i.productId, qty: i.qty, extendedWarranty: i.warranty, pedestal: !!i.pedestal })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not place order");
      if (usePoints && q?.pointsRedeemed) track("points_redeemed", { value: q.pointsRedeemed });
      clear();
      router.push(`/order/${data.token}?new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order. Please try again or use WhatsApp.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_22rem]" noValidate>
      <div className="grid h-fit gap-4">
        {!member && q && (
          <section className="card flex flex-wrap items-center gap-3 border-2 border-amber-300 bg-amber-50/60 p-4">
            <p className="flex-1 text-sm">
              <b>Earn {q.pointsEarned.toLocaleString()} points on this order.</b> Sign in or join {q.rewardsName} free with your phone number.
            </p>
            <Link href="/account/sign-in?next=/checkout" className="btn btn-brand">Sign in / Join</Link>
            <p className="w-full text-xs text-slate-600">Or continue as a guest below. You can join later with the same phone number and still collect these points.</p>
          </section>
        )}
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Your details</h2>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" defaultValue={member?.name} className="input" /></div>
            <div><label className="label" htmlFor="phone">Phone (07xx / 01xx)</label><input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" /></div>
          </div>
          <div><label className="label" htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" autoComplete="email" defaultValue={member?.email} className="input" /></div>
        </section>
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Delivery</h2>
          <div>
            <label className="label" htmlFor="zone">Delivery area</label>
            <select id="zone" className="input" required value={zoneId ?? ""} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Select area…</option>
              {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
            {q?.zone && <p className="mt-1 text-xs text-slate-600">Lead time: {q.zone.leadTime}{q.deliveryNote ? ` · ${q.deliveryNote}` : ""}</p>}
          </div>
          <div><label className="label" htmlFor="address">Address / landmark</label><textarea id="address" name="address" rows={2} required className="input" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="deliveryDate">Preferred delivery date</label><input id="deliveryDate" name="deliveryDate" type="date" className="input" min={new Date().toISOString().slice(0, 10)} /></div>
            <div>
              <label className="label" htmlFor="deliverySlot">Preferred time</label>
              <select id="deliverySlot" name="deliverySlot" className="input" defaultValue="">
                <option value="">Any time</option>
                {slots.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {q && q.installOptions.length > 0 && (
            <fieldset>
              <legend className="label">Installation</legend>
              {q.installOptions.map((o) => (
                <label key={o.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={installIds.includes(o.id)}
                    onChange={(e) => setInstallIds((cur) => (e.target.checked ? [...cur, o.id] : cur.filter((x) => x !== o.id)))}
                  />
                  {o.name} ({o.price === 0 ? "free" : ksh(o.price)})
                </label>
              ))}
              {q.zone && installIds.length > 0 && q.install > q.chosenInstall.reduce((n, x) => n + x.price, 0) && (
                <p className="text-xs text-slate-500">Includes an installation surcharge for {q.zone.name}.</p>
              )}
            </fieldset>
          )}
          <div><label className="label" htmlFor="notes">Notes (floor, access, gate code…)</label><textarea id="notes" name="notes" rows={2} className="input" /></div>
        </section>
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Payment</h2>
          <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="pay" className="mt-1 h-5 w-5" checked={effectivePay === "mpesa"} onChange={() => setPay("mpesa")} />
            <span><span className="block font-bold">M-Pesa</span><span className="text-sm text-slate-600">You&apos;ll get our Till number with your order number as the reference, then enter your M-Pesa code.</span></span>
          </label>
          {q?.podOk ? (
            <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-light">
              <input type="radio" name="pay" className="mt-1 h-5 w-5" checked={effectivePay === "pod"} onChange={() => setPay("pod")} />
              <span><span className="block font-bold">Pay on Delivery</span><span className="text-sm text-slate-600">We call to confirm your order. You pay via M-Pesa when it arrives.</span></span>
            </label>
          ) : (
            <p className="text-xs text-slate-500">Pay on Delivery is available in eligible areas for orders up to {ksh(q?.podCap ?? 0)}{q?.zone ? "" : " — choose your area to check"}.</p>
          )}
          {q && q.deposit > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">For high-value orders a {q.depositPct}% deposit ({ksh(q.deposit)}) is requested to secure your order.</p>}
        </section>
        {q && member && <RewardsPanel q={q} next="/checkout" />}
      </div>
      <aside className="card h-fit p-4">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="mt-2 divide-y text-sm">
          {items.map((i) => {
            const l = q?.lines.find((x) => x.productId === i.productId);
            return (
              <li key={i.productId} className="flex justify-between gap-2 py-2">
                <span>{i.qty} × {i.name}{i.warranty ? " + ext. warranty" : ""}{i.pedestal && l?.pedestalPrice ? " + stand" : ""}</span>
                <span className="shrink-0 font-semibold">{ksh((l?.price ?? i.price) * i.qty)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="promo">Promo code</label>
          <input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo or price code" className="input !min-h-11 uppercase" />
          <button type="button" className="btn btn-outline !px-3" onClick={() => setPromoCode(promoInput.trim())}>Apply</button>
        </div>
        {q?.promo?.error && <p className="mt-1 text-xs font-semibold text-red-700">{q.promo.error}</p>}
        {q && q.redeemMax > 0 && (
          <label className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            <span>Use {q.redeemMax.toLocaleString()} points (−{ksh(q.redeemMax)})<span className="block text-xs text-slate-600">Balance {q.available.toLocaleString()} points · up to 10% of product value</span></span>
          </label>
        )}
        {q && (
          <dl className="mt-3 space-y-1 text-sm" aria-busy={loading}>
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{ksh(q.subtotal)}</dd></div>
            {q.savings > 0 && <div className="flex justify-between text-emerald-700"><dt>You save</dt><dd>{ksh(q.savings)}</dd></div>}
            {q.addons > 0 && <div className="flex justify-between"><dt>Add-ons</dt><dd>{ksh(q.addons)}</dd></div>}
            {q.promoDiscount > 0 && <div className="flex justify-between text-emerald-700"><dt>Code {q.promo?.code}</dt><dd>−{ksh(q.promoDiscount)}</dd></div>}
            {q.pointsRedeemed > 0 && <div className="flex justify-between text-emerald-700"><dt>Points used</dt><dd>−{ksh(q.pointsRedeemed)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{q.zone ? (q.delivery === 0 ? "Free" : ksh(q.delivery)) : "—"}</dd></div>
            <div className="flex justify-between"><dt>Installation</dt><dd>{q.chosenInstall.length ? (q.install === 0 ? "Free" : ksh(q.install)) : "—"}</dd></div>
            <div className="flex justify-between border-t pt-2 text-lg font-extrabold"><dt>Total</dt><dd>{ksh(q.total)}</dd></div>
            <div className="flex justify-between font-semibold text-amber-800"><dt>Points to earn</dt><dd>{q.pointsEarned.toLocaleString()}</dd></div>
          </dl>
        )}
        {q?.errors.map((e) => <p key={e} role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{e}</p>)}
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" name="marketing" className="mt-1 h-5 w-5 shrink-0" />
          <span>Send me deals and points updates by SMS or WhatsApp. I can opt out any time.</span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" className="mt-1 h-5 w-5 shrink-0" />
          <span>I agree to the <Link className="underline" href="/terms" target="_blank">terms of sale</Link> and <Link className="underline" href="/privacy" target="_blank">privacy policy</Link>.</span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !q?.zone}>{busy ? "Placing order…" : q?.zone ? `Place order · ${ksh(q.total)}` : "Select delivery area"}</button>
      </aside>
    </form>
  );
}
