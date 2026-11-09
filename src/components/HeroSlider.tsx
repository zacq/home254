"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isRemoteImage } from "@/lib/format";

type Slide = Record<string, string>;

// Admin-managed hero deal slider (PRD FR-8). Pauses on hover/focus; swipe on touch.
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);
  if (!n) return null;
  const s = slides[i];
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Deals"
      className="relative isolate overflow-hidden bg-brand-dark text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
      }}
    >
      {s.image && <Image key={s.image + i} src={s.image} alt="" fill priority={i === 0} sizes="100vw" unoptimized={isRemoteImage(s.image)} className="-z-10 object-cover opacity-40" />}
      <div className="container-x min-h-[18rem] py-12 sm:min-h-[22rem] sm:py-20" aria-live={paused ? "polite" : "off"} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>
        {s.eyebrow && <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{s.eyebrow}</p>}
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">{s.heading}</h1>
        {s.subheading && <p className="mt-4 max-w-xl text-base text-slate-100 sm:text-lg">{s.subheading}</p>}
        {s.ctaLabel && s.ctaHref && <Link href={s.ctaHref} className="btn btn-primary mt-6 !px-6">{s.ctaLabel}</Link>}
      </div>
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {slides.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Show slide ${k + 1}`} aria-current={k === i} className="grid h-11 w-8 place-items-center">
              <span className={`block h-2.5 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2.5 bg-white/50"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
