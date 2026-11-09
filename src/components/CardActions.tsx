"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/components/CartProvider";

export function CardCartButton({ item, disabled }: { item: Omit<CartItem, "qty" | "warranty" | "pedestal">; disabled: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      className="btn btn-primary flex-1 !min-h-11 !px-2 !text-sm"
      disabled={disabled}
      aria-label={`Add ${item.name} to cart`}
      onClick={() => {
        add(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
    >
      {disabled ? "Out of stock" : added ? "✓ Added" : "🛒 Add to cart"}
    </button>
  );
}
