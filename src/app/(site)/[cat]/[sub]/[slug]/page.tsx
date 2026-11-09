import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs, ReviewCards, SectionTitle, Stars } from "@/components/Bits";
import { Countdown } from "@/components/Countdown";
import { LeadForm } from "@/components/LeadForm";
import { BuyButtons, ExitPrompt, Gallery, VideoOnTap, ViewItemTracker } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { WishlistButton } from "@/components/Wishlist";
import { specRows } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { getCustomer } from "@/lib/customer-auth";
import {
  featureAnchor,
  indicativeMonthly,
  isRemoteImage,
  jsonLd as toJsonLd,
  ksh,
  MIN_REVIEWS_FOR_RATING,
  priceInfo,
  productImage,
  productPath,
  stockState,
} from "@/lib/format";
import { addOnProducts, findCategory, getCardContext, getInstallServices, productBySlug, productPoints, publishedReviews, relatedProducts, zones } from "@/lib/queries";
import { balances, getRewardsConfig, TIER_LABEL } from "@/lib/rewards";
import { getSettings, waLink } from "@/lib/settings";
import { productWaLink } from "@/lib/wa";

type Props = { params: Promise<{ cat: string; sub: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await productBySlug(slug);
  if (!p) return {};
  const { price } = priceInfo(p);
  return {
    title: { absolute: p.seoTitle || `${p.name} (${p.modelNumber}) Price in Kenya – ${ksh(price)} | NyumbaniAppliances` },
    description:
      p.metaDescription ||
      `${p.shortBenefit} Buy the ${p.brand} ${p.modelNumber} for ${ksh(price)} in Kenya and earn Rewards points. Delivery, installation, M-Pesa and Pay on Delivery.`,
    alternates: { canonical: productPath(p) },
    openGraph: { images: [productImage(p)] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { cat, sub, slug } = await params;
  const p = await productBySlug(slug);
  if (!p) notFound();
  if (p.category !== cat || (p.subcategory || "all") !== sub) permanentRedirect(productPath(p));

  const [s, c, related, reviews, zoneList, services, info, ctx, cfg, member, addOns] = await Promise.all([
    getSettings(),
    findCategory(p.category),
    relatedProducts(p),
    publishedReviews(p.id, 6),
    zones(),
    getInstallServices(),
    getContent("productInfo"),
    getCardContext(),
    getRewardsConfig(),
    getCustomer(),
    addOnProducts([p.category], [p.id], 3),
  ]);
  const subName = c?.subs.find((x) => x.slug === p.subcategory)?.name;
  const pi = priceInfo(p);
  const st = stockState(p);
  const points = productPoints(p, ctx);
  const wa = productWaLink(s.whatsapp, p, points);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const mainImage = productImage(p);
  const instalment = indicativeMonthly(pi.price, s.financingRates);
  const myInstall = services.filter((x) => x.category === p.category);
  const laundry = p.category === "washers" && !!(p.washCapacityKg || p.dryCapacityKg);
  const ratingAvg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const showRating = reviews.length >= MIN_REVIEWS_FOR_RATING;

  // "Pay KSh Y after using your Z points" (FR-18), within the redemption cap.
  const available = member ? (await balances(member.id)).available : 0;
  const usable = available >= cfg.redeemMin ? Math.min(available, Math.floor((pi.price * cfg.redeemCapPct) / 100)) : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    sku: p.modelNumber,
    mpn: p.modelNumber,
    image: [isRemoteImage(mainImage) ? mainImage : `${site}${mainImage}`],
    description: p.description,
    offers: {
      "@type": "Offer",
      url: `${site}${productPath(p)}`,
      priceCurrency: "KES",
      price: pi.price,
      availability: p.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(pi.onOffer && p.offerEnd ? { priceValidUntil: p.offerEnd.toISOString().slice(0, 10) } : {}),
    },
    ...(showRating
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: Math.round(ratingAvg * 10) / 10, reviewCount: reviews.length },
          review: reviews.map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewRating: { "@type": "Rating", ratingValue: r.rating }, reviewBody: r.body })),
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <ViewItemTracker productId={p.id} value={pi.price} />
      <ExitPrompt href={wa} />
      <div className="container-x py-4">
        <Breadcrumbs items={[["Home", "/"], [c?.name ?? p.category, `/${p.category}`], ...(subName ? [[subName, `/${p.category}/${p.subcategory}`] as [string, string]] : []), [p.modelNumber, productPath(p)]]} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative">
            <Gallery images={p.images.length ? p.images : [mainImage]} alt={`${p.name} — ${p.modelNumber}`} />
            {pi.was && <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2.5 py-1 text-sm font-extrabold text-white">SALE −{pi.pct}%</span>}
          </div>
          <div>
            <p className="text-sm font-semibold text-brand">{p.brand} · Model {p.modelNumber}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-brand-dark sm:text-3xl">{p.name}</h1>
            <p className="mt-2 text-slate-700">{p.shortBenefit}</p>
            {showRating && (
              <p className="mt-1 text-sm"><Stars n={Math.round(ratingAvg)} /> <a href="#reviews" className="text-slate-600 underline">{reviews.length} verified reviews</a></p>
            )}

            <section aria-label="Price" className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              {pi.was && <p className="text-sm text-slate-500">Was <span className="line-through">{ksh(pi.was)}</span></p>}
              <p className="text-3xl font-extrabold text-brand-dark">{ksh(pi.price)}</p>
              {pi.save > 0 && <p className="mt-1 text-sm font-bold text-emerald-700">You save {ksh(pi.save)} ({pi.pct}%)</p>}
              {pi.onOffer && p.offerEnd && (
                <p className="mt-1 text-sm font-semibold text-red-700">
                  {p.offerBadge || "Sale"}
                  {p.offerQtyCap != null && ` · ${Math.max(0, p.offerQtyCap - p.offerSold)} left at this price`} · <Countdown end={p.offerEnd.toISOString()} />
                </p>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                <Link href="/best-price-promise" className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark">🏷️ Best Price Promise</Link>
                {info.priceNote && <span className="text-xs text-slate-500">{info.priceNote}</span>}
              </p>
              {instalment && (
                <p className="mt-2 text-sm text-slate-700">
                  Or from about <b>{ksh(instalment.monthly)}/month</b> over {instalment.months} months. Indicative only; our financing partner confirms terms.{" "}
                  <a href="#instalments" className="font-semibold text-brand underline">Ask us</a>
                </p>
              )}
            </section>

            <section aria-label={s.rewardsName} className="mt-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="font-bold text-amber-900">⭐ Earn {points.toLocaleString()} points{member ? ` as a ${TIER_LABEL[ctx.tier]} member` : ""}</p>
              {member ? (
                usable > 0 ? (
                  <p className="mt-1 text-sm">Pay <b>{ksh(pi.price - usable)}</b> after using your <b>{usable.toLocaleString()} points</b>.</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">You have {available.toLocaleString()} points. You can use them once you reach {cfg.redeemMin}.</p>
                )
              ) : (
                <p className="mt-1 text-sm text-slate-700">
                  <Link href={`/account/sign-in?next=${encodeURIComponent(productPath(p))}`} className="font-semibold text-brand underline">Join free</Link> and get {cfg.signupBonus} welcome points.
                </p>
              )}
            </section>

            <div className="mt-4 grid gap-2">
              <BuyButtons
                disabled={p.stockQty <= 0}
                p={{ productId: p.id, path: productPath(p), name: p.name, modelNumber: p.modelNumber, price: pi.price, image: mainImage, max: p.stockQty, laundry }}
              />
              <TrackedLink href={wa} event="whatsapp_click" productId={p.id} external className="btn btn-wa">💬 Order on WhatsApp</TrackedLink>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <TrackedLink href={`tel:${s.phoneTel}`} event="call_click" productId={p.id} className="btn btn-outline !px-2 !text-sm">📞 Call</TrackedLink>
                <a href="#book" className="btn btn-outline !px-2 !text-sm">📅 Showroom</a>
                <a href="#instalments" className="btn btn-outline !px-2 !text-sm">💳 Instalments</a>
                <WishlistButton id={p.id} />
              </div>
            </div>
            {p.stockQty <= 0 && (
              <details className="card mt-3 p-3">
                <summary className="cursor-pointer font-semibold">🔔 Notify me when back in stock</summary>
                <div className="mt-3">
                  <LeadForm type="notify" fields={[]} productId={p.id} productName={`${p.name} (${p.modelNumber})`} submitLabel="Notify me" successMessage="We'll message you as soon as it's back." />
                </div>
              </details>
            )}

            {(p.features.length > 0 || p.motor.includes("BLDC")) && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Key features">
                {p.features.map((f) => (
                  <li key={f}>
                    <Link href={`/technology#${featureAnchor(f)}`} className="inline-flex min-h-11 items-center rounded-full border border-brand/30 bg-brand-light px-3 text-xs font-semibold text-brand-dark hover:bg-brand/10">
                      {f} ⓘ
                    </Link>
                  </li>
                ))}
                {p.motor.includes("BLDC") && (
                  <li><Link href="/technology#bldc" className="inline-flex min-h-11 items-center rounded-full border border-brand/30 bg-brand-light px-3 text-xs font-semibold text-brand-dark">BLDC inverter motor ⓘ</Link></li>
                )}
              </ul>
            )}
          </div>
        </div>

        {addOns.length > 0 && (
          <section className="mt-8">
            <SectionTitle>Frequently bought together</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              {addOns.map((a) => {
                const api = priceInfo(a);
                return (
                  <Link key={a.id} href={productPath(a)} className="card flex items-center gap-3 p-3 hover:shadow-md">
                    <Image src={productImage(a)} alt="" width={72} height={72} unoptimized={isRemoteImage(productImage(a))} className="h-16 w-16 rounded-lg object-cover" />
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold leading-tight">{a.name}</span>
                      <span className="block font-bold text-brand-dark">{ksh(api.price)}</span>
                      {cfg.crossSellBonus > 0 && <span className="block text-xs font-bold text-amber-800">+{cfg.crossSellBonus} bonus points with this {p.type.toLowerCase()}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-2">
            <h2 className="text-lg font-bold">About this product</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{p.description}</p>
            {p.videoUrl && <VideoOnTap url={p.videoUrl} title={p.name} />}
            <h2 className="mt-6 text-lg font-bold">Specifications</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {specRows(p).map(([k, v]) => (
                  <tr key={k} className="border-t border-slate-100">
                    <th scope="row" className="w-2/5 py-2 pr-3 text-left font-semibold text-slate-600">{k}</th>
                    <td className="py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.manualPdf && <p className="mt-3"><a href={p.manualPdf} className="font-semibold text-brand underline" target="_blank" rel="noopener noreferrer">⬇ Download manual / brochure</a></p>}
          </div>
          <div className="card h-fit p-4">
            <h2 className="text-lg font-bold">Delivery & installation</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {zoneList.map((z) => (
                <li key={z.id} className="rounded-lg bg-slate-50 p-2">
                  <span className="block font-semibold">{z.name}</span>
                  <span className="text-slate-600">
                    {z.fee === 0 ? "Free delivery" : z.freeAbove && pi.price >= z.freeAbove ? "Free delivery on this item" : `${ksh(z.fee)} delivery`} · {z.leadTime}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Gold members get free delivery in Zones 1–2; Platinum everywhere.</p>
            {myInstall.length > 0 && (
              <>
                <h3 className="mt-4 font-bold">Installation</h3>
                <ul className="mt-1 text-sm text-slate-700">
                  {myInstall.map((x) => <li key={x.id}>{x.name}: <b>{x.price === 0 ? "free" : ksh(x.price)}</b></li>)}
                </ul>
              </>
            )}
            {laundry && (
              <>
                <h3 className="mt-4 font-bold">Installation needs</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {info.installNeeds.split("\n").filter(Boolean).map((x) => <li key={x}>{x}</li>)}
                </ul>
              </>
            )}
            <h3 className="mt-4 font-bold">Warranty</h3>
            <p className="text-sm text-slate-700">{p.warranty}. <Link href="/e-warranty" className="font-semibold text-brand underline">Register it online</Link> for bonus points.</p>
            <h3 className="mt-4 font-bold">In the box</h3>
            <p className="text-sm text-slate-700">{info.inTheBox}</p>
          </div>
        </section>

        <section id="reviews" className="mt-8 scroll-mt-32">
          <SectionTitle>Customer reviews</SectionTitle>
          {reviews.length ? (
            <ReviewCards reviews={reviews} />
          ) : (
            <p className="card p-4 text-sm text-slate-600">No reviews yet. Only customers whose order has been delivered can review, so every review here is from a real buyer.</p>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div id="instalments" className="card scroll-mt-32 p-4">
            <h2 className="text-lg font-bold">Ask about instalments</h2>
            <p className="mb-3 mt-1 text-sm text-slate-600">Plans available — ask us. Our financing partner contacts you; approval is decided by the partner.</p>
            <LeadForm type="financing" fields={["plan", "employment"]} productId={p.id} productName={`${p.name} (${p.modelNumber})`} submitLabel="Request instalment plan" event="financing_submit" successMessage="Request received. Our team will call you about instalment plans." consentText="I consent to be contacted by the store and its financing partner about instalment plans." />
          </div>
          <div id="book" className="card scroll-mt-32 p-4">
            <h2 className="text-lg font-bold">Book a showroom visit</h2>
            <p className="mb-3 mt-1 text-sm text-slate-600">See this product at our store. {s.openingHours}</p>
            <LeadForm type="booking" fields={["date", "slot"]} productId={p.id} productName={`${p.name} (${p.modelNumber})`} submitLabel="Book my visit" event="booking_submit" successMessage="Booking received! We'll confirm by WhatsApp or SMS." />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <SectionTitle href={`/${p.category}/${p.subcategory}`} link={`All ${subName ?? "products"}`}>Related products</SectionTitle>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}
        <p className="mt-6 text-xs text-slate-500">
          Need help deciding?{" "}
          <a className="underline" href={waLink(s.whatsapp, `Hi, I'd like help choosing. I'm looking at ${p.modelNumber}.`)}>Chat with us</a>.
        </p>
      </div>
    </>
  );
}
