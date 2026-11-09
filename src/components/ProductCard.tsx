import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/Bits";
import { CardCartButton } from "@/components/CardActions";
import { CompareToggle } from "@/components/Compare";
import { WishlistButton } from "@/components/Wishlist";
import type { Product } from "@/db/schema";
import { keySpecs } from "@/lib/catalog";
import { isRemoteImage, ksh, MIN_REVIEWS_FOR_RATING, priceInfo, productImage, productPath, stockState } from "@/lib/format";
import { getCardContext, productPoints } from "@/lib/queries";

// Brand header, stock badge, SALE badge, was/now price, PLUS X POINTS strip, cart and wishlist (PRD FR-15).
export async function ProductCard({ p, priority }: { p: Product; priority?: boolean }) {
  const ctx = await getCardContext();
  const pi = priceInfo(p);
  const st = stockState(p);
  const points = productPoints(p, ctx);
  const rating = ctx.ratings.get(p.id);
  const img = productImage(p);
  const flash = pi.onOffer && p.offerQtyCap != null;
  return (
    <article className="card flex flex-col overflow-hidden transition hover:shadow-lg">
      <p className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-600">
        {p.brand}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${st.cls}`}>{st.key === "out" ? "Out of stock" : st.key === "low" ? st.label : "In stock"}</span>
      </p>
      <div className="relative bg-slate-100">
        <Link href={productPath(p)} className="block">
          <Image
            src={img}
            alt={`${p.name} — ${p.modelNumber}`}
            width={480}
            height={480}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="aspect-square w-full object-cover"
            priority={priority}
            unoptimized={isRemoteImage(img)}
          />
        </Link>
        {pi.was && (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-extrabold text-white">
            {flash ? "FLASH" : "SALE"} −{pi.pct}%
          </span>
        )}
        <WishlistButton id={p.id} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-bold leading-snug sm:text-base">
          <Link href={productPath(p)} className="hover:text-brand">{p.name}</Link>
        </h3>
        <p className="text-xs text-slate-500">Model {p.modelNumber}</p>
        {keySpecs(p) && <p className="text-xs text-slate-600">{keySpecs(p)}</p>}
        {rating && rating.n >= MIN_REVIEWS_FOR_RATING && (
          <p className="text-xs"><Stars n={Math.round(rating.avg)} /> <span className="text-slate-500">({rating.n})</span></p>
        )}
        <div className="mt-auto pt-1">
          {pi.was && <p className="text-xs text-slate-500 line-through">{ksh(pi.was)}</p>}
          <p className="text-lg font-extrabold text-brand-dark">{ksh(pi.price)}</p>
        </div>
      </div>
      {points > 0 && (
        <p className="bg-amber-100 px-3 py-1 text-center text-xs font-extrabold tracking-wide text-amber-900">PLUS {points.toLocaleString()} POINTS</p>
      )}
      <div className="flex items-center gap-2 p-2">
        <CardCartButton
          disabled={p.stockQty <= 0}
          item={{ productId: p.id, path: productPath(p), name: p.name, modelNumber: p.modelNumber, price: pi.price, image: img, max: p.stockQty, laundry: !!(p.washCapacityKg || p.dryCapacityKg) }}
        />
        <CompareToggle id={p.id} compact />
      </div>
    </article>
  );
}
