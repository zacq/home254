"use client";

type Win = Window & {
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
};

const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export function track(name: string, params: { productId?: number; value?: number; [k: string]: unknown } = {}) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    w.gtag?.("event", name, params);
    if (META_MAP[name]) {
      w.fbq?.("track", META_MAP[name], params.value ? { value: params.value, currency: "KES" } : {});
    } else {
      w.fbq?.("trackCustom", name, {});
    }
    if (["whatsapp_click", "call_click", "view_item", "add_to_cart", "begin_checkout", "purchase", "quiz_complete", "booking_submit", "financing_submit"].includes(name)) {
      const body = JSON.stringify({ name, productId: params.productId ?? null, page: window.location.pathname });
      navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    }
  } catch {
    /* analytics must never break the page */
  }
}
