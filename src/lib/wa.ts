import type { Product } from "@/db/schema";
import { activePrice, ksh, waLink } from "@/lib/format";

// Pre-filled with product, model number, price and points (PRD EN-4).
export function productWaLink(number: string, p: Product, points?: number) {
  const { price } = activePrice(p);
  return waLink(
    number,
    `Hi, I'd like to order the ${p.name} (model ${p.modelNumber}) at ${ksh(price)}${points ? `, earning ${points} points` : ""}. Is it available for delivery to [area]?`,
  );
}
