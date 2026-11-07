"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";

export type CartItem = {
  productId: number;
  path: string;
  name: string;
  modelNumber: string;
  price: number;
  image: string;
  qty: number;
  warranty: boolean;
  pedestal?: boolean;
  laundry?: boolean;
  max: number;
};

type Ctx = {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (i: Omit<CartItem, "qty" | "warranty" | "pedestal">) => void;
  remove: (id: number) => void;
  setQty: (id: number, q: number) => void;
  toggleWarranty: (id: number) => void;
  togglePedestal: (id: number) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const refreshed = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  // A saved cart can outlive a price change, so show the live price before checkout.
  useEffect(() => {
    if (!ready || refreshed.current || !items.length) return;
    refreshed.current = true;
    fetch(`/api/products?ids=${items.map((i) => i.productId).join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { products: { id: number; price: number; stock: number }[] } | null) => {
        if (!data) return;
        const live = new Map(data.products.map((p) => [p.id, p]));
        setItems((cur) =>
          cur.flatMap((i) => {
            const p = live.get(i.productId);
            return p ? [{ ...i, price: p.price, max: p.stock, qty: Math.max(1, Math.min(i.qty, p.stock)) }] : [];
          }),
        );
      })
      .catch(() => {});
  }, [ready, items]);

  const add = useCallback((i: Omit<CartItem, "qty" | "warranty" | "pedestal">) => {
    setItems((cur) => {
      const ex = cur.find((c) => c.productId === i.productId);
      if (ex) return cur.map((c) => (c.productId === i.productId ? { ...c, ...i, qty: Math.min(c.qty + 1, i.max || 10) } : c));
      return [...cur, { ...i, qty: 1, warranty: false }];
    });
    track("add_to_cart", { productId: i.productId, value: i.price });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.qty, 0),
      add,
      remove: (id) => setItems((c) => c.filter((i) => i.productId !== id)),
      setQty: (id, q) =>
        setItems((c) => c.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, Math.min(q, i.max || 10)) } : i))),
      toggleWarranty: (id) => setItems((c) => c.map((i) => (i.productId === id ? { ...i, warranty: !i.warranty } : i))),
      togglePedestal: (id) => setItems((c) => c.map((i) => (i.productId === id ? { ...i, pedestal: !i.pedestal } : i))),
      clear: () => setItems([]),
    }),
    [items, ready, add],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
