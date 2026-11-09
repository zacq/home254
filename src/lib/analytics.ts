"use client";

type Win = Window & {
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
};

const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  rewards_signup: "CompleteRegistration",
};

// Commerce, Rewards and engagement events also counted in admin (PRD NF-14 to NF-16).
const STORED = new Set([
  "whatsapp_click", "call_click", "view_item", "view_item_list", "add_to_cart", "add_to_wishlist", "begin_checkout", "purchase",
  "quiz_complete", "booking_submit", "financing_submit", "rewards_signup", "points_redeemed", "nudge_shown", "nudge_accepted",
  "mega_menu_open", "filter_used", "price_match_request", "review_submitted",
]);

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
    if (STORED.has(name)) {
      const body = JSON.stringify({ name, productId: params.productId ?? null, page: window.location.pathname });
      navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    }
  } catch {
    /* analytics must never break the page */
  }
}
