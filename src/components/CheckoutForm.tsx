"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { lineAddons, useZone, type ZoneLite } from "@/components/CartView";
import { track } from "@/lib/analytics";
import { ksh } from "@/lib/format";

export function CheckoutForm({
  zones,
  warrantyPct,
  pedestalPrice,
  podCap,
  depositThreshold,
  depositPct,
}: {
  zones: ZoneLite[];
  warrantyPct: number;
  pedestalPrice: number;
  podCap: number;
  depositThreshold: number;
  depositPct: number;
}) {
  const { items, ready, clear } = useCart();
  const router = useRouter();
  const [zoneId, setZoneId] = useZone();
  const [install, setInstall] = useState(true);
  const [pay, setPay] = useState<"mpesa" | "pod">("mpesa");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (ready && items.length && !tracked.current) {
      tracked.current = true;
      track("begin_checkout", { value: items.reduce((n, i) => n + i.price * i.qty, 0) });
    }
  }, [ready, items]);

  const zone = zones.find((z) => z.id === zoneId);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const addons = items.reduce((n, i) => n + lineAddons(i, warrantyPct, pedestalPrice), 0);
  const instFee = zone && install ? zone.installFee : 0;
  const total = subtotal + addons + (zone?.fee ?? 0) + instFee;
  const podOk = !!zone?.podAllowed && total <= podCap;
  const effectivePay = pay === "pod" && !podOk ? "mpesa" : pay;
  const deposit = total >= depositThreshold ? Math.ceil((total * depositPct) / 100 / 100) * 100 : 0;

  if (!ready) return <p className="container-x py-10">Loading…</p>;
  if (!items.length)
    return (
      <div className="container-x py-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link href="/washing-machines" className="btn btn-primary mt-4">Browse washing machines</Link>
      </div>
    );

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
          phone: fd.get("phone"),
          email: fd.get("email"),
          zoneId,
          address: fd.get("address"),
          deliveryDate: fd.get("deliveryDate"),
          installation: install,
          notes: fd.get("notes"),
          paymentMethod: effectivePay,
          website: fd.get("website"),
          terms: fd.get("terms") === "on",
          lines: items.map((i) => ({ productId: i.productId, qty: i.qty, extendedWarranty: i.warranty, pedestal: !!i.pedestal })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not place order");
      clear();
      router.push(`/order/${data.token}?new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order. Please try again or use WhatsApp.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_22rem]" noValidate>
      <div className="grid gap-4">
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Your details</h2>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
            <div><label className="label" htmlFor="phone">Phone (07xx / 01xx)</label><input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="0712 345 678" className="input" /></div>
          </div>
          <div><label className="label" htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" autoComplete="email" className="input" /></div>
        </section>
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Delivery</h2>
          <div>
            <label className="label" htmlFor="zone">Delivery area</label>
            <select id="zone" className="input" required value={zoneId ?? ""} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Select area…</option>
              {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
            {zone && <p className="mt-1 text-xs text-slate-600">Lead time: {zone.leadTime}</p>}
          </div>
          <div><label className="label" htmlFor="address">Address / landmark</label><textarea id="address" name="address" rows={2} required className="input" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="deliveryDate">Preferred delivery date</label><input id="deliveryDate" name="deliveryDate" type="date" className="input" min={new Date().toISOString().slice(0, 10)} /></div>
            <fieldset>
              <legend className="label">Installation</legend>
              <div className="flex gap-4 pt-2 text-sm">
                <label className="flex min-h-11 items-center gap-2"><input type="radio" name="install" checked={install} onChange={() => setInstall(true)} className="h-5 w-5" /> Yes{zone ? (zone.installFee === 0 ? " (free)" : ` (+${ksh(zone.installFee)})`) : ""}</label>
                <label className="flex min-h-11 items-center gap-2"><input type="radio" name="install" checked={!install} onChange={() => setInstall(false)} className="h-5 w-5" /> No</label>
              </div>
            </fieldset>
          </div>
          <div><label className="label" htmlFor="notes">Notes (floor, access, gate code…)</label><textarea id="notes" name="notes" rows={2} className="input" /></div>
        </section>
        <section className="card grid gap-3 p-4">
          <h2 className="text-lg font-bold">Payment</h2>
          <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="pay" className="mt-1 h-5 w-5" checked={effectivePay === "mpesa"} onChange={() => setPay("mpesa")} />
            <span><span className="block font-bold">M-Pesa</span><span className="text-sm text-slate-600">You&apos;ll get our Till number and your order number as the reference, then enter your M-Pesa code.</span></span>
          </label>
          {podOk ? (
            <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-light">
              <input type="radio" name="pay" className="mt-1 h-5 w-5" checked={effectivePay === "pod"} onChange={() => setPay("pod")} />
              <span><span className="block font-bold">Pay on Delivery</span><span className="text-sm text-slate-600">We call to confirm your order. You pay via M-Pesa when the machine arrives.</span></span>
            </label>
          ) : (
            <p className="text-xs text-slate-500">Pay on Delivery is available for eligible areas on orders up to {ksh(podCap)}{zone ? "" : " — choose your area to check"}.</p>
          )}
          {deposit > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">For high-value orders a {depositPct}% deposit ({ksh(deposit)}) is requested to secure your order.</p>}
        </section>
      </div>
      <aside className="card h-fit p-4">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="mt-2 divide-y text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2 py-2">
              <span>{i.qty} × {i.name}{i.warranty ? " + ext. warranty" : ""}{i.pedestal && pedestalPrice > 0 ? " + stand" : ""}</span>
              <span className="shrink-0 font-semibold">{ksh(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          {addons > 0 && <div className="flex justify-between"><dt>Add-ons</dt><dd>{ksh(addons)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{zone ? (zone.fee === 0 ? "Free" : ksh(zone.fee)) : "—"}</dd></div>
          <div className="flex justify-between"><dt>Installation</dt><dd>{!install ? "—" : instFee === 0 ? "Free" : ksh(instFee)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-extrabold"><dt>Total</dt><dd>{ksh(total)}</dd></div>
        </dl>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" className="mt-1 h-5 w-5 shrink-0" />
          <span>I agree to the <Link className="underline" href="/terms" target="_blank">terms of sale</Link> and <Link className="underline" href="/privacy" target="_blank">privacy policy</Link>.</span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !zone}>{busy ? "Placing order…" : zone ? "Place order" : "Select delivery area"}</button>
      </aside>
    </form>
  );
}
