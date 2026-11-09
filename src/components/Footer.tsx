import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import type { Item } from "@/lib/content-schema";
import type { Settings } from "@/lib/settings";
import { waLink } from "@/lib/settings";

export function Footer({ s, branches, menu }: { s: Settings; branches: Item[]; menu: { name: string; path: string }[] }) {
  return (
    <footer className="mt-16 bg-brand-dark pb-24 text-slate-200 lg:pb-8">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white">{s.storeName}</h2>
          <p className="mt-2 text-sm">{s.tagline}</p>
          <div className="mt-3 text-sm">
            <p><TrackedLink className="font-semibold underline" href={`tel:${s.phoneTel}`} event="call_click">📞 {s.phoneDisplay}</TrackedLink></p>
            <p><TrackedLink className="underline" href={waLink(s.whatsapp, "Hi, I have a question.")} event="whatsapp_click" external>💬 WhatsApp us</TrackedLink></p>
            <p><a className="underline" href={`mailto:${s.email}`}>✉️ {s.email}</a></p>
          </div>
          <h3 className="mb-1 mt-4 font-bold text-white">Stores</h3>
          <ul className="space-y-1 text-sm">
            {branches.map((b) => (
              <li key={b.name}><Link href="/showroom" className="underline">{b.name}</Link> · {b.address}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-300">{s.dealerStatement}</p>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">Shop</h3>
          <ul className="space-y-1">
            {menu.map((m) => <li key={m.path}><Link className="underline" href={m.path}>{m.name}</Link></li>)}
            <li><Link className="font-bold text-red-300 underline" href="/deals">Deals</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">Help</h3>
          <ul className="space-y-1">
            <li><Link className="underline" href="/delivery-warranty">Delivery & installation</Link></li>
            <li><Link className="underline" href="/e-warranty">E-Warranty & after sales</Link></li>
            <li><Link className="underline" href="/payment-options">Payment options & instalments</Link></li>
            <li><Link className="underline" href="/best-price-promise">Best Price Promise</Link></li>
            <li><Link className="underline" href="/returns">Returns & refunds</Link></li>
            <li><Link className="underline" href="/technology">Technology explained</Link></li>
            <li><Link className="underline" href="/which-machine">Which washing machine?</Link></li>
            <li><Link className="underline" href="/compare">Compare products</Link></li>
            <li><Link className="underline" href="/contact">Contact us</Link></li>
            <li><Link className="underline" href="/about">About us</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">{s.rewardsName}</h3>
          <ul className="space-y-1">
            <li><Link className="underline" href="/rewards">How Rewards works</Link></li>
            <li><Link className="underline" href="/account">My account & points</Link></li>
            <li><Link className="underline" href="/rewards#terms">Rewards terms</Link></li>
            <li><Link className="underline" href="/terms">Terms of sale</Link></li>
            <li><Link className="underline" href="/privacy">Privacy policy</Link></li>
          </ul>
          <h3 className="mb-2 mt-5 font-bold text-white">We accept</h3>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-green-700">M-PESA</span>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-brand">Pay on Delivery</span>
            <span className="rounded-md bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">Reward points</span>
          </div>
          <h3 className="mb-2 mt-5 font-bold text-white">Follow us</h3>
          <div className="flex flex-wrap gap-3">
            <a className="underline" href={s.instagram} rel="noopener noreferrer" target="_blank">Instagram</a>
            <a className="underline" href={s.facebook} rel="noopener noreferrer" target="_blank">Facebook</a>
            <a className="underline" href={s.youtube} rel="noopener noreferrer" target="_blank">YouTube</a>
            <a className="underline" href={s.tiktok} rel="noopener noreferrer" target="_blank">TikTok</a>
          </div>
        </div>
      </div>
      <p className="container-x border-t border-white/10 pt-4 text-xs text-slate-400">© {new Date().getFullYear()} {s.storeName}. Prices in KSh, inclusive of VAT where applicable.</p>
    </footer>
  );
}
