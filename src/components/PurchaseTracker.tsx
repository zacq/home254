"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function PurchaseTracker({ orderNumber, value }: { orderNumber: string; value: number }) {
  useEffect(() => {
    const k = `purchase-${orderNumber}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    track("purchase", { value, transaction_id: orderNumber });
  }, [orderNumber, value]);
  return null;
}
