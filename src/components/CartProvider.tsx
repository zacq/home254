"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  sync: (live: { productId: number; price: number; stock: number; laundry: boolean }[]) => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  // A saved cart can outlive a price change; the live quote updates prices and drops removed products.
  const sync = useCallback((live: { productId: number; price: number; stock: number; laundry: boolean }[]) => {
    const byId = new Map(live.map((l) => [l.productId, l]));
    setItems((cur) => {
      let changed = false;
      const next = cur.flatMap((i) => {
        const l = byId.get(i.productId);
        if (!l) {
          changed = true;
          return [];
        }
        if (l.price === i.price && l.stock === i.max && l.laundry === !!i.laundry) return [i];
        changed = true;
        return [{ ...i, price: l.price, max: l.stock, laundry: l.laundry, qty: Math.max(1, Math.min(i.qty, l.stock || 1)) }];
      });
      return changed ? next : cur;
    });
  }, []);

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
      sync,
    }),
    [items, ready, add, sync],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
