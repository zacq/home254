"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

// Right-side "Loyalty Points" tab and social bar (PRD FR-5).
export function SideBars({ member, socials, whatsappHref }: { member: { points: number } | null; socials: { label: string; href: string; icon: string }[]; whatsappHref: string }) {
  return (
    <>
      <Link
        href={member ? "/account" : "/rewards"}
        className="fixed right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-xl bg-amber-500 px-1.5 py-3 text-xs font-extrabold text-amber-950 shadow-lg [writing-mode:vertical-rl] print:hidden"
        aria-label={member ? `Loyalty points: ${member.points} points` : "Loyalty points: join free"}
      >
        ⭐ {member ? `${member.points.toLocaleString()} pts` : "Loyalty Points"}
      </Link>
      <ul className="fixed right-0 top-[calc(50%+5.5rem)] z-30 hidden flex-col overflow-hidden rounded-l-xl shadow-lg lg:flex print:hidden" aria-label="Follow us">
        {socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-10 w-10 place-items-center bg-white text-sm font-black text-brand hover:bg-brand-light">{s.icon}</a>
          </li>
        ))}
        <li>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => track("whatsapp_click", {})} className="grid h-10 w-10 place-items-center bg-wa text-lg text-white">💬</a>
        </li>
      </ul>
    </>
  );
}

type PopReview = { id: number; name: string; location: string | null; rating: number; body: string; product: string | null };

// Verified review pop-up: real reviews only, after the main content, dismissible, once per page view (PRD FR-6).
export function ReviewPopup({ reviews }: { reviews: PopReview[] }) {
  const [r, setR] = useState<PopReview | null>(null);
  useEffect(() => {
    if (!reviews.length) return;
    const t = setTimeout(() => setR(reviews[Math.floor(Math.random() * reviews.length)]), 9000);
    return () => clearTimeout(t);
  }, [reviews]);
  if (!r) return null;
  return (
    <aside aria-label="Recent verified review" className="fixed bottom-20 left-3 right-14 z-30 max-w-xs rounded-2xl border border-slate-200 bg-white p-3 pr-10 shadow-xl sm:left-auto sm:right-14 lg:bottom-6 print:hidden">
      <button className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-slate-500" aria-label="Dismiss review" onClick={() => setR(null)}>✕</button>
      <p className="text-sm text-amber-500" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-700">“{r.body}”</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        {r.name}{r.location ? `, ${r.location}` : ""} <span className="text-emerald-700">✔ Verified buyer</span>
        {r.product && <span className="block font-normal text-slate-500">{r.product}</span>}
      </p>
    </aside>
  );
}
