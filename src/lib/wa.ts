import type { Product } from "@/db/schema";
import { activePrice, ksh, waLink } from "@/lib/format";


export function productWaLink(number: string, p: Product) {
  const { price } = activePrice(p);
  return waLink(
    number,
    `Hi, I'm interested in the ${p.name} (${p.modelNumber}) at ${ksh(price)}. Is it available for delivery to [area]?`,
  );
}
