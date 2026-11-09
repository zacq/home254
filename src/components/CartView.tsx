"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart, type CartItem } from "@/components/CartProvider";
import { track } from "@/lib/analytics";
import { isRemoteImage, ksh } from "@/lib/format";
import type { Quote } from "@/lib/orders";

export type ZoneLite = { id: number; name: string };

export function useZone() {
  const [zoneId, setZoneId] = useState<number | null>(null);
  useEffect(() => {
    const z = Number(localStorage.getItem("zone"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    if (z) setZoneId(z);
  }, []);
  return [
    zoneId,
    (id: number | null) => {
      setZoneId(id);
      if (id) localStorage.setItem("zone", String(id));
    },
  ] as const;
}

type QuoteExtras = { zoneId?: number | null; installIds?: number[]; promoCode?: string; usePoints?: boolean; phone?: string };

// Live server quote for the cart: prices, points, delivery, promo and points redemption.
export function useQuote(items: CartItem[], ready: boolean, extras: QuoteExtras) {
  const { sync } = useCart();
  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const body = JSON.stringify({
    lines: items.map((i) => ({ productId: i.productId, qty: i.qty, extendedWarranty: i.warranty, pedestal: !!i.pedestal })),
    ...extras,
  });
  useEffect(() => {
    if (!ready || !items.length) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctl.signal })
        .then((r) => r.json())
        .then((data: Quote) => {
          setQ(data);
          sync(data.lines.map((l) => ({ productId: l.productId, price: l.price, stock: l.stock, laundry: l.laundry })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- body captures items and extras
  }, [body, ready]);
  return { q, loading };
}

export function RewardsPanel({ q, next }: { q: Quote; next: string }) {
  const { add } = useCart();
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current && (q.tierNudge || q.suggestions.length)) {
      shown.current = true;
      track("nudge_shown", {});
    }
  }, [q.tierNudge, q.suggestions.length]);
  return (
    <section className="card grid gap-2 border-2 border-amber-300 bg-amber-50/60 p-4" aria-label={q.rewardsName}>
      <h2 className="font-bold">⭐ {q.rewardsName}</h2>
      {q.signedIn ? (
        <p className="text-sm">You&apos;ll earn <b>{q.pointsEarned.toLocaleString()} points</b> on this order{q.available ? ` · balance ${q.available.toLocaleString()} points` : ""}.</p>
      ) : (
        <p className="text-sm">
          <Link href={`/account/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-brand underline">Sign in or join free</Link> to earn <b>{q.pointsEarned.toLocaleString()} points</b> on this order.
        </p>
      )}
      {q.tierNudge && <p className="text-sm font-semibold text-amber-900">{q.tierNudge}</p>}
      {q.suggestions.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white p-2">
          <Image src={s.image} alt="" width={56} height={56} unoptimized={isRemoteImage(s.image)} className="h-14 w-14 rounded-lg object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold leading-tight">Add {s.name}</p>
            <p className="text-xs text-slate-600">{ksh(s.price)} · <b className="text-amber-800">+{s.bonus} bonus points</b></p>
          </div>
          <button
            className="btn btn-outline !min-h-11 !px-3 !text-sm"
            onClick={() => {
              add({ productId: s.id, path: s.path, name: s.name, modelNumber: s.modelNumber, price: s.price, image: s.image, max: s.max, laundry: false });
              track("nudge_accepted", { productId: s.id });
            }}
          >
            Add
          </button>
        </div>
      ))}
    </section>
  );
}

export function CartView({ zones }: { zones: ZoneLite[] }) {
  const { items, ready, setQty, remove, toggleWarranty, togglePedestal } = useCart();
  const [zoneId, setZoneId] = useZone();
  const { q } = useQuote(items, ready, { zoneId });

  if (!ready) return <p className="container-x py-10">Loading your cart…</p>;
  if (!items.length)
    return (
      <div className="container-x py-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link href="/deals" className="btn btn-primary mt-4">See today&apos;s deals</Link>
      </div>
    );

  const line = (id: number) => q?.lines.find((l) => l.productId === id);

  return (
    <div className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid h-fit gap-3">
        <ul className="grid gap-3">
          {items.map((i) => {
            const l = line(i.productId);
            return (
              <li key={i.productId} className="card flex gap-3 p-3">
                <Image src={i.image} alt="" width={96} height={96} unoptimized={isRemoteImage(i.image)} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={i.path} className="font-bold leading-tight hover:text-brand">{i.name}</Link>
                  <p className="text-xs text-slate-500">{i.modelNumber}</p>
                  <p className="mt-1 font-extrabold text-brand-dark">
                    {ksh(l?.price ?? i.price)}
                    {l?.was && <span className="ml-2 text-sm font-normal text-slate-500 line-through">{ksh(l.was)}</span>}
                  </p>
                  {l && l.points + l.bonus > 0 && <p className="text-xs font-bold text-amber-700">PLUS {(l.points + l.bonus).toLocaleString()} POINTS{l.bonus ? ` (incl. ${l.bonus} add-on bonus)` : ""}</p>}
                  <label className="mt-2 flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={i.warranty} onChange={() => toggleWarranty(i.productId)} />
                    <span>Add extended warranty{l?.warrantyPrice ? ` (+${ksh(l.warrantyPrice)})` : ""}</span>
                  </label>
                  {(l?.laundry ?? i.laundry) && (
                    <label className="mt-2 flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={!!i.pedestal} onChange={() => togglePedestal(i.productId)} />
                      <span>Add stand / pedestal{l?.pedestalPrice ? ` (+${ksh(l.pedestalPrice)})` : ""}</span>
                    </label>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button className="btn btn-outline !min-h-11 !w-11 !px-0" aria-label="Decrease quantity" onClick={() => setQty(i.productId, i.qty - 1)}>−</button>
                    <span className="w-8 text-center font-bold" aria-live="polite">{i.qty}</span>
                    <button className="btn btn-outline !min-h-11 !w-11 !px-0" aria-label="Increase quantity" onClick={() => setQty(i.productId, i.qty + 1)}>+</button>
                    <button className="ml-auto text-sm font-semibold text-red-700 underline" onClick={() => remove(i.productId)}>Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {q && <RewardsPanel q={q} next="/cart" />}
      </div>
      <aside className="card h-fit p-4">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="mt-3">
          <label className="label" htmlFor="zone">Delivery area</label>
          <select id="zone" className="input" value={zoneId ?? ""} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select area…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        {q ? (
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{ksh(q.subtotal)}</dd></div>
            {q.savings > 0 && <div className="flex justify-between text-emerald-700"><dt>You save</dt><dd>{ksh(q.savings)}</dd></div>}
            {q.addons > 0 && <div className="flex justify-between"><dt>Add-ons</dt><dd>{ksh(q.addons)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{q.zone ? (q.delivery === 0 ? "Free" : ksh(q.delivery)) : "Select area"}</dd></div>
            {q.deliveryNote && <p className="text-xs text-slate-500">{q.deliveryNote}</p>}
            <div className="flex justify-between border-t pt-2 text-base font-extrabold"><dt>Total</dt><dd>{ksh(q.subtotal + q.addons + q.delivery)}</dd></div>
            <div className="flex justify-between text-amber-800"><dt>Points to earn</dt><dd>{q.pointsEarned.toLocaleString()}</dd></div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Updating prices…</p>
        )}
        {q?.errors.map((e) => <p key={e} role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{e}</p>)}
        <p className="mt-2 text-xs text-slate-500">Installation, promo codes and points are applied at checkout.</p>
        <Link href="/checkout" className="btn btn-primary mt-4 w-full">Checkout</Link>
      </aside>
    </div>
  );
}
