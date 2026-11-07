"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { TrackedLink } from "@/components/TrackedLink";

export const NAV = [
  { href: "/washing-machines", label: "Washing Machines" },
  { href: "/combos", label: "Combos" },
  { href: "/dryers", label: "Dryers" },
  { href: "/other-appliances", label: "Other Appliances" },
  { href: "/which-machine", label: "Which Machine?" },
  { href: "/payment-options", label: "Payment Options" },
  { href: "/showroom", label: "Showroom" },
  { href: "/contact", label: "Contact" },
];

export function Header({ storeName, phoneTel, phoneDisplay, announcement }: { storeName: string; phoneTel: string; phoneDisplay: string; announcement: string }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {announcement && <p className="bg-brand-dark px-3 py-1.5 text-center text-xs text-white">{announcement}</p>}
      <div className="container-x flex items-center gap-2 py-2">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-extrabold text-brand" onClick={() => setOpen(false)}>
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-brand text-lg text-white">◎</span>
          <span className="hidden text-lg leading-tight sm:block">{storeName}</span>
        </Link>
        <form action="/search" className="mx-1 flex min-w-0 flex-1" role="search">
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" name="q" type="search" placeholder="Search name, model or 10kg…" className="input !rounded-r-none" />
          <button className="btn btn-brand !rounded-l-none !px-3" aria-label="Search">🔍</button>
        </form>
        <TrackedLink href={`tel:${phoneTel}`} event="call_click" className="btn btn-outline hidden !px-3 lg:inline-flex" label="Call us">
          📞 {phoneDisplay}
        </TrackedLink>
        <Link href="/cart" className="btn btn-outline relative !px-3" aria-label={`Cart, ${count} items`}>
          🛒
          <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-bold text-white">{count}</span>
        </Link>
        <button className="btn btn-brand !px-3 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          {open ? "✕" : "☰"}<span className="sr-only">Menu</span>
        </button>
      </div>
      <nav className="hidden border-t border-slate-100 lg:block" aria-label="Main">
        <ul className="container-x flex gap-1 py-1">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-brand-light hover:text-brand">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {open && (
        <nav id="mobile-nav" className="max-h-[75vh] overflow-y-auto border-t border-slate-100 bg-white lg:hidden" aria-label="Mobile">
          <ul className="container-x py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-slate-100 text-base font-semibold text-slate-800">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
