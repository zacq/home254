"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { track } from "@/lib/analytics";
import { isRemoteImage } from "@/lib/format";

type P = { productId: number; path: string; name: string; modelNumber: string; price: number; image: string; max: number; laundry: boolean };

export function BuyButtons({ p, disabled }: { p: P; disabled: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        className="btn btn-primary"
        disabled={disabled}
        onClick={() => {
          add(p);
          track("begin_checkout", { productId: p.productId, value: p.price });
          router.push("/checkout");
        }}
      >
        Buy now
      </button>
      <button
        className="btn btn-outline"
        disabled={disabled}
        onClick={() => {
          add(p);
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }}
      >
        {added ? "✓ Added to cart" : "Add to cart"}
      </button>
    </div>
  );
}

export function ViewItemTracker({ productId, value }: { productId: number; value: number }) {
  useEffect(() => {
    track("view_item", { productId, value });
  }, [productId, value]);
  return null;
}

export function ExitPrompt({ href }: { href: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("wa-prompt")) return;
    const trigger = () => {
      if (sessionStorage.getItem("wa-prompt")) return;
      sessionStorage.setItem("wa-prompt", "1");
      setShow(true);
    };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + window.innerHeight) / h.scrollHeight > 0.8) trigger();
    };
    const onLeave = (e: MouseEvent) => e.clientY <= 0 && trigger();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  if (!show) return null;
  return (
    <div role="dialog" aria-label="Chat with us" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:bottom-24 lg:left-auto lg:right-6">
      <button className="absolute right-2 top-2 grid h-11 w-11 place-items-center text-slate-500" aria-label="Close" onClick={() => setShow(false)}>✕</button>
      <p className="pr-8 font-bold">Questions? Chat with us on WhatsApp</p>
      <p className="mt-1 text-sm text-slate-600">A real person replies in minutes during opening hours.</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-wa mt-3 w-full"
        onClick={() => track("whatsapp_click", {})}
      >
        💬 Open WhatsApp
      </a>
    </div>
  );
}

const SWIPE_PX = 40;

const youtubeId = (url: string) => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];

export function VideoOnTap({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const id = youtubeId(url);
  if (!id)
    return <p className="mt-3"><a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">▶ Watch product video</a></p>;
  if (!open) return <button className="btn btn-outline mt-3" onClick={() => setOpen(true)}>▶ Watch product video</button>;
  return <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={`${title} video`} allow="autoplay; encrypted-media" allowFullScreen className="mt-3 aspect-video w-full rounded-xl border-0" />;
}

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);
  const list = images.length ? images : ["/images/washer.svg"];
  return (
    <div>
      <button
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100"
        onClick={() => {
          if (!swiped.current) setZoom(true);
          swiped.current = false;
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
          swiped.current = false;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) < SWIPE_PX || list.length < 2) return;
          swiped.current = true;
          setI((n) => (n + (dx < 0 ? 1 : -1) + list.length) % list.length);
        }}
        aria-label="Zoom image"
      >
        <Image src={list[i]} alt={alt} width={800} height={800} sizes="(max-width:1024px) 100vw, 50vw" priority unoptimized={isRemoteImage(list[i])} className="aspect-square w-full object-cover" />
      </button>
      {list.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {list.map((src, n) => (
            <button key={src + n} onClick={() => setI(n)} aria-label={`Image ${n + 1}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${n === i ? "border-brand" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setZoom(false)} role="dialog" aria-label="Zoomed image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[i]} alt={alt} className="max-h-full max-w-full rounded-xl object-contain" />
          <button className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white text-lg" aria-label="Close zoom">✕</button>
        </div>
      )}
    </div>
  );
}
