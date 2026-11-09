"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

const KEY = "wishlist.v1";
const listeners = new Set<() => void>();
let member = false;

function read() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, ids.join(","));
  } catch {
    return;
  }
  listeners.forEach((fn) => fn());
}

const parse = (raw: string) => raw.split(",").map(Number).filter((n) => n > 0);

function post(body: { add?: number[]; remove?: number[] }) {
  if (!member) return;
  fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
}

export function useWishlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const ids = useMemo(() => parse(raw), [raw]);
  return {
    ids,
    toggle: (id: number) => {
      const on = ids.includes(id);
      write(on ? ids.filter((x) => x !== id) : [id, ...ids].slice(0, 100));
      post(on ? { remove: [id] } : { add: [id] });
      if (!on) track("add_to_wishlist", { productId: id });
    },
  };
}

// Merges the device wishlist with the member's saved one after sign-in (account wishlist, PRD FR-28).
export function WishlistSync({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    member = signedIn;
    if (!signedIn) return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d: { ids: number[] }) => {
        const local = parse(read());
        const merged = [...new Set([...d.ids, ...local])];
        write(merged);
        const missing = local.filter((id) => !d.ids.includes(id));
        if (missing.length) post({ add: missing });
      })
      .catch(() => {});
  }, [signedIn]);
  return null;
}

export function WishlistButton({ id, className = "" }: { id: number; className?: string }) {
  const { ids, toggle } = useWishlist();
  const on = ids.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid h-11 w-11 place-items-center rounded-full bg-white/90 text-xl shadow-sm ring-1 ring-slate-200 ${on ? "text-red-600" : "text-slate-500"} ${className}`}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}

export function WishlistCount() {
  const { ids } = useWishlist();
  return <>{ids.length}</>;
}

// Keeps /wishlist?ids=… in step with the device list so the page can render server-side.
export function WishlistUrlSync() {
  const { ids } = useWishlist();
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const want = ids.join(",");
  useEffect(() => {
    if ((sp.get("ids") ?? "") !== want) router.replace(`${path}?ids=${want}`, { scroll: false });
  }, [want, sp, router, path]);
  return null;
}
