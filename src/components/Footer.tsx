import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import type { Settings } from "@/lib/settings";
import { waLink } from "@/lib/settings";

export function Footer({ s }: { s: Settings }) {
  return (
    <footer className="mt-16 bg-brand-dark pb-24 text-slate-200 lg:pb-8">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-bold text-white">{s.storeName}</h2>
          <p className="mt-2 text-sm">{s.tagline}</p>
          <p className="mt-3 text-xs text-slate-300">{s.dealerStatement}</p>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">Visit & contact</h3>
          <p>{s.showroomAddress}</p>
          <p className="mt-1">{s.openingHours}</p>
          <p className="mt-2"><TrackedLink className="underline" href={`tel:${s.phoneTel}`} event="call_click">{s.phoneDisplay}</TrackedLink></p>
          <p><TrackedLink className="underline" href={waLink(s.whatsapp, "Hi, I have a question.")} event="whatsapp_click" external>WhatsApp us</TrackedLink></p>
          <p><a className="underline" href={`mailto:${s.email}`}>{s.email}</a></p>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">Help</h3>
          <ul className="space-y-1">
            <li><Link className="underline" href="/delivery-warranty">Delivery, installation & warranty</Link></li>
            <li><Link className="underline" href="/payment-options">Payment options & instalments</Link></li>
            <li><Link className="underline" href="/technology">Technology explained</Link></li>
            <li><Link className="underline" href="/compare">Compare machines</Link></li>
            <li><Link className="underline" href="/returns">Returns & refunds</Link></li>
            <li><Link className="underline" href="/terms">Terms of sale</Link></li>
            <li><Link className="underline" href="/privacy">Privacy policy</Link></li>
            <li><Link className="underline" href="/about">About us</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="mb-2 font-bold text-white">We accept</h3>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-green-700">M-PESA</span>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-brand">Pay on Delivery</span>
          </div>
          <h3 className="mb-2 mt-5 font-bold text-white">Follow us</h3>
          <div className="flex gap-4">
            <a className="underline" href={s.instagram} rel="noopener noreferrer" target="_blank">Instagram</a>
            <a className="underline" href={s.tiktok} rel="noopener noreferrer" target="_blank">TikTok</a>
            <a className="underline" href={s.facebook} rel="noopener noreferrer" target="_blank">Facebook</a>
          </div>
        </div>
      </div>
      <p className="container-x border-t border-white/10 pt-4 text-xs text-slate-400">© {new Date().getFullYear()} {s.storeName}. Prices in KSh, inclusive of VAT where applicable.</p>
    </footer>
  );
}
