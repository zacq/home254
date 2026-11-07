"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, type CartItem } from "@/components/CartProvider";
import { isRemoteImage, ksh } from "@/lib/format";

export type ZoneLite = { id: number; name: string; fee: number; installFee: number; podAllowed: boolean; leadTime: string };

export const warrantyPrice = (price: number, pct: number) => Math.round((price * pct) / 100 / 100) * 100;

export const lineAddons = (i: CartItem, warrantyPct: number, pedestalPrice: number) =>
  ((i.warranty ? warrantyPrice(i.price, warrantyPct) : 0) + (i.pedestal && pedestalPrice > 0 ? pedestalPrice : 0)) * i.qty;

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

export function CartView({ zones, warrantyPct, pedestalPrice }: { zones: ZoneLite[]; warrantyPct: number; pedestalPrice: number }) {
  const { items, ready, setQty, remove, toggleWarranty, togglePedestal } = useCart();
  const [zoneId, setZoneId] = useZone();
  const zone = zones.find((z) => z.id === zoneId);

  if (!ready) return <p className="container-x py-10">Loading your cart…</p>;
  if (!items.length)
    return (
      <div className="container-x py-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link href="/washing-machines" className="btn btn-primary mt-4">Browse washing machines</Link>
      </div>
    );

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const addons = items.reduce((n, i) => n + lineAddons(i, warrantyPct, pedestalPrice), 0);
  const delivery = zone?.fee ?? 0;

  return (
    <div className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_22rem]">
      <ul className="grid gap-3">
        {items.map((i) => (
          <li key={i.productId} className="card flex gap-3 p-3">
            <Image src={i.image} alt="" width={96} height={96} unoptimized={isRemoteImage(i.image)} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={i.path} className="font-bold leading-tight hover:text-brand">{i.name}</Link>
              <p className="text-xs text-slate-500">{i.modelNumber}</p>
              <p className="mt-1 font-extrabold text-brand-dark">{ksh(i.price)}</p>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={i.warranty} onChange={() => toggleWarranty(i.productId)} />
                <span>Add extended warranty (+{ksh(warrantyPrice(i.price, warrantyPct))})</span>
              </label>
              {i.laundry && pedestalPrice > 0 && (
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={!!i.pedestal} onChange={() => togglePedestal(i.productId)} />
                  <span>Add stand / pedestal (+{ksh(pedestalPrice)})</span>
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
        ))}
      </ul>
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
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{ksh(subtotal)}</dd></div>
          {addons > 0 && <div className="flex justify-between"><dt>Add-ons</dt><dd>{ksh(addons)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{zone ? (zone.fee === 0 ? "Free" : ksh(zone.fee)) : "Select area"}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-extrabold"><dt>Total</dt><dd>{ksh(subtotal + addons + delivery)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">Installation is free or priced by area — choose it at checkout. Final price is confirmed when we confirm your order.</p>
        <Link href="/checkout" className="btn btn-primary mt-4 w-full">Checkout</Link>
      </aside>
    </div>
  );
}
