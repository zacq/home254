"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { TrackedLink } from "@/components/TrackedLink";
import { WishlistCount } from "@/components/Wishlist";
import { track } from "@/lib/analytics";
import { isRemoteImage, ksh } from "@/lib/format";

export type MenuItem = { slug: string; name: string; path: string; image: string; isCore: boolean; subs: { name: string; path: string; image: string }[] };
export type PromoMessage = { text: string; href: string; kind: string };

const TIER_BADGES = [
  ["Bronze", "bg-amber-700"],
  ["Silver", "bg-slate-400"],
  ["Gold", "bg-yellow-500"],
  ["Platinum", "bg-slate-800"],
];

// Rotating promo strip: deals messages and the Rewards banner with tier badges (PRD FR-1).
function PromoStrip({ messages }: { messages: PromoMessage[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || messages.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [paused, messages.length]);
  const m = messages[i];
  if (!m) return null;
  return (
    <div className={`${m.kind === "rewards" ? "bg-brand-dark" : "bg-red-700"} text-white`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="container-x flex min-h-9 items-center justify-center gap-2 py-1 text-center text-xs font-semibold sm:text-sm" aria-live="polite">
        {m.kind === "rewards" && (
          <span className="hidden gap-1 sm:flex" aria-hidden>
            {TIER_BADGES.map(([t, c]) => <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${c}`}>{t}</span>)}
          </span>
        )}
        {m.href ? <Link href={m.href} className="underline-offset-2 hover:underline">{m.text}</Link> : <span>{m.text}</span>}
        {messages.length > 1 && (
          <button className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[10px]" aria-label="Next message" onClick={() => setI((n) => (n + 1) % messages.length)}>▶</button>
        )}
      </div>
    </div>
  );
}

type Suggest = { products: { name: string; model: string; path: string; price: number; image: string }[]; categories: { name: string; path: string }[]; brands: string[] };

// Search with autocomplete by product, brand, model number and category (PRD FR-2).
function SearchBox({ id }: { id: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [s, setS] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${id}-list`;

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: Suggest) => {
          setS(d);
          setActive(-1);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const options = s && q.trim().length >= 2
    ? [
        ...s.products.map((p) => ({ label: p.name, sub: `${p.model} · ${ksh(p.price)}`, href: p.path, image: p.image })),
        ...s.categories.map((c) => ({ label: c.name, sub: "Category", href: c.path, image: "" })),
        ...s.brands.map((b) => ({ label: b, sub: "Brand", href: `/search?q=${encodeURIComponent(b)}`, image: "" })),
      ]
    : [];
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter" && active >= 0 && options[active]) {
      e.preventDefault();
      go(options[active].href);
    }
  };

  return (
    <form action="/search" className="relative flex min-w-0 flex-1" role="search" onSubmit={() => setOpen(false)}>
      <label htmlFor={id} className="sr-only">Search products, brands or model numbers</label>
      <input
        id={id}
        name="q"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search TVs, fridges, brands or model no."
        className="input !rounded-r-none"
      />
      <button className="btn btn-brand !rounded-l-none !px-3" aria-label="Search">🔍</button>
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {options.map((o, n) => (
            <li key={o.href + n} id={`${listId}-${n}`} role="option" aria-selected={n === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(o.href)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${n === active ? "bg-brand-light" : "hover:bg-slate-50"}`}>
                {o.image ? <Image src={o.image} alt="" width={40} height={40} unoptimized={isRemoteImage(o.image)} className="h-10 w-10 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded bg-slate-100" aria-hidden>{o.sub === "Brand" ? "🏷️" : "📂"}</span>}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{o.label}</span>
                  <span className="block text-xs text-slate-500">{o.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function SubTiles({ cat, onPick }: { cat: MenuItem; onPick: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {cat.subs.map((s) => (
        <Link key={s.path} href={s.path} onClick={onPick} className="group rounded-xl bg-slate-50 p-2 text-center hover:bg-brand-light">
          <Image src={s.image} alt="" width={96} height={96} loading="lazy" unoptimized={isRemoteImage(s.image)} className="mx-auto h-16 w-16 object-contain transition group-hover:scale-105" />
          <span className="mt-1 block text-xs font-semibold leading-tight">{s.name}</span>
        </Link>
      ))}
      <Link href={cat.path} onClick={onPick} className="grid place-items-center rounded-xl border-2 border-dashed border-brand/30 p-2 text-center text-xs font-bold text-brand">
        All {cat.name} →
      </Link>
    </div>
  );
}

// Full-width category bar; hover (desktop) or tap opens sub-category picture tiles (PRD FR-3).
function MegaMenu({ menu }: { menu: MenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const show = (slug: string | null, delay = 0) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(slug);
      if (slug) track("mega_menu_open", { category: slug });
    }, delay);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(null);
  }
  const current = menu.find((m) => m.slug === open);
  return (
    <nav className="relative hidden border-t border-slate-100 bg-white lg:block" aria-label="Categories" onMouseLeave={() => show(null, 150)} onKeyDown={(e) => e.key === "Escape" && setOpen(null)}>
      <ul className="container-x flex flex-wrap items-center gap-x-1">
        {menu.map((m) => (
          <li key={m.slug} onMouseEnter={() => show(m.slug, 120)}>
            <button
              type="button"
              aria-expanded={open === m.slug}
              aria-controls="mega-panel"
              onClick={() => (open === m.slug ? setOpen(null) : show(m.slug))}
              className={`inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold ${open === m.slug ? "bg-brand-light text-brand" : "text-slate-700 hover:text-brand"} ${m.isCore ? "" : "font-medium"}`}
            >
              {m.name}
            </button>
          </li>
        ))}
        <li><Link href="/e-warranty" className="inline-flex min-h-11 items-center px-2.5 text-sm font-medium text-slate-700 hover:text-brand">E-Warranty</Link></li>
        <li><Link href="/deals" className="inline-flex min-h-11 items-center rounded-lg bg-red-600 px-3 text-sm font-extrabold text-white hover:bg-red-700">🔥 Deals</Link></li>
      </ul>
      {current && (
        <div id="mega-panel" className="absolute inset-x-0 top-full z-40 border-t border-slate-100 bg-white shadow-2xl" onMouseEnter={() => show(current.slug)}>
          <div className="container-x py-4">
            <p className="mb-2 font-extrabold text-brand-dark">{current.name}</p>
            <SubTiles cat={current} onPick={() => setOpen(null)} />
          </div>
        </div>
      )}
    </nav>
  );
}

// Mobile: swipeable category tiles, then the chosen category's sub-category tiles (PRD FR-4).
function MobileMenu({ menu, onClose }: { menu: MenuItem[]; onClose: () => void }) {
  const [cat, setCat] = useState(menu[0]?.slug ?? "");
  const current = menu.find((m) => m.slug === cat);
  return (
    <nav id="mobile-nav" className="max-h-[80vh] overflow-y-auto border-t border-slate-100 bg-white lg:hidden" aria-label="Mobile">
      <div className="flex snap-x gap-2 overflow-x-auto px-4 py-3">
        {menu.map((m) => (
          <button
            key={m.slug}
            onClick={() => {
              setCat(m.slug);
              track("mega_menu_open", { category: m.slug });
            }}
            aria-pressed={cat === m.slug}
            className={`w-24 shrink-0 snap-start rounded-xl p-2 text-center ${cat === m.slug ? "bg-brand text-white" : "bg-slate-100"}`}
          >
            <Image src={m.image} alt="" width={64} height={64} unoptimized={isRemoteImage(m.image)} className="mx-auto h-12 w-12 rounded-lg bg-white object-contain" />
            <span className="mt-1 block text-xs font-semibold leading-tight">{m.name}</span>
          </button>
        ))}
      </div>
      {current && <div className="px-4 pb-3"><SubTiles cat={current} onPick={onClose} /></div>}
      <ul className="container-x grid grid-cols-2 gap-2 border-t border-slate-100 py-3 text-sm font-semibold">
        {[["/deals", "🔥 Deals"], ["/rewards", "⭐ Rewards"], ["/best-price-promise", "Best Price Promise"], ["/e-warranty", "E-Warranty"], ["/which-machine", "Which machine?"], ["/showroom", "📍 Stores"], ["/payment-options", "Payment options"], ["/contact", "Contact"]].map(([h, l]) => (
          <li key={h}><Link href={h} onClick={onClose} className="flex min-h-11 items-center rounded-lg bg-slate-50 px-3">{l}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function Header({
  storeName,
  tagline,
  phoneTel,
  phoneDisplay,
  menu,
  promos,
  member,
}: {
  storeName: string;
  tagline: string;
  phoneTel: string;
  phoneDisplay: string;
  menu: MenuItem[];
  promos: PromoMessage[];
  member: { name: string; points: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const searchId = useId();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const icon = "relative grid min-h-11 min-w-11 place-items-center rounded-xl px-1 text-xl hover:bg-slate-100";
  const badge = "absolute -right-0.5 -top-0.5 min-w-5 rounded-full px-1 text-center text-[11px] font-bold text-white";
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <PromoStrip messages={promos} />
      <div className="container-x flex items-center gap-2 py-2">
        <button className="btn btn-brand !min-h-11 !px-3 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          {open ? "✕" : "☰"}<span className="sr-only">Menu</span>
        </button>
        <Link href="/" className="flex min-h-11 items-center gap-2 text-brand">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-lg font-black text-white">N</span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-extrabold">{storeName}</span>
            <span className="block text-[11px] font-medium text-slate-500">{tagline}</span>
          </span>
        </Link>
        <div className="mx-2 hidden flex-1 md:flex"><SearchBox id={searchId} /></div>
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <TrackedLink href={`tel:${phoneTel}`} event="call_click" className="hidden min-h-11 items-center rounded-xl px-2 text-sm font-bold text-brand hover:bg-slate-100 xl:inline-flex" label={`Call ${phoneDisplay}`}>
            📞 {phoneDisplay}
          </TrackedLink>
          <Link href="/showroom" className={`${icon} hidden sm:grid`} aria-label="Store locator" title="Store locator">📍</Link>
          <Link href={member ? "/account" : "/account/sign-in"} className="flex min-h-11 items-center gap-1 rounded-xl px-1.5 hover:bg-slate-100" aria-label={member ? `My account, ${member.points} points` : "Sign in or join Rewards"}>
            <span className="text-xl" aria-hidden>👤</span>
            <span className="hidden text-left text-xs leading-tight sm:block">
              {member ? <><span className="block font-semibold">{member.name || "My account"}</span><span className="block font-bold text-amber-700">{member.points.toLocaleString()} pts</span></> : <><span className="block font-semibold">Sign in</span><span className="block text-slate-500">Join Rewards</span></>}
            </span>
          </Link>
          <Link href="/wishlist" className={icon} aria-label="Wishlist">
            ♡<span className={`${badge} bg-red-600`}><WishlistCount /></span>
          </Link>
          <Link href="/cart" className={icon} aria-label={`Cart, ${count} items`}>
            🛒<span className={`${badge} bg-accent`}>{count}</span>
          </Link>
        </div>
      </div>
      <div className="container-x pb-2 md:hidden"><SearchBox id={`${searchId}-m`} /></div>
      <MegaMenu menu={menu} />
      {open && <MobileMenu menu={menu} onClose={() => setOpen(false)} />}
    </header>
  );
}
