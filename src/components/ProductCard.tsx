import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/db/schema";
import { activePrice, capacityLabel, isRemoteImage, ksh, productImage, productPath, stockState } from "@/lib/format";
import { productWaLink } from "@/lib/wa";
import { CompareToggle } from "@/components/Compare";
import { TrackedLink } from "@/components/TrackedLink";

function keyBadge(p: Product) {
  if (p.dryCapacityKg && p.washCapacityKg) return "Washer-dryer";
  if (p.features.includes("SpaCare steam wash")) return "Steam wash";
  if (p.features.includes("Heat pump")) return "Heat pump";
  if (p.motor.includes("BLDC")) return "Inverter motor";
  return p.type;
}

export function ProductCard({ p, whatsapp, priority }: { p: Product; whatsapp: string; priority?: boolean }) {
  const { price, onOffer } = activePrice(p);
  const st = stockState(p);
  return (
    <article className="card flex flex-col overflow-hidden transition hover:shadow-lg">
      <Link href={productPath(p)} className="relative block bg-slate-100">
        <Image
          src={productImage(p)}
          alt={`${p.name} — ${p.modelNumber}`}
          width={480}
          height={480}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="aspect-square w-full object-cover"
          priority={priority}
          unoptimized={isRemoteImage(productImage(p))}
        />
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">{keyBadge(p)}</span>
        {onOffer && <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">{p.offerBadge || "Offer"}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-sm font-bold leading-snug sm:text-base">
          <Link href={productPath(p)} className="hover:text-brand">{p.name}</Link>
        </h3>
        <p className="text-xs text-slate-600">
          {[capacityLabel(p), p.energyRating ? `Energy ${p.energyRating}` : "", p.spinRpm ? `${p.spinRpm} RPM` : ""].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto pt-1">
          <p className="text-lg font-extrabold text-brand-dark">
            {ksh(price)}
            {onOffer && <span className="ml-2 text-sm font-normal text-slate-500 line-through">{ksh(p.priceKsh)}</span>}
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
        </div>
        <TrackedLink href={productWaLink(whatsapp, p)} event="whatsapp_click" productId={p.id} external className="btn btn-wa mt-2 !text-sm">
          💬 Order on WhatsApp
        </TrackedLink>
        {!!(p.washCapacityKg || p.dryCapacityKg) && <CompareToggle id={p.id} />}
      </div>
    </article>
  );
}
