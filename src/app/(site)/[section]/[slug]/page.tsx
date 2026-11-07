import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ReviewCards, SectionTitle, Stars } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { BuyButtons, ExitPrompt, Gallery, VideoOnTap, ViewItemTracker } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { getContent } from "@/lib/content";
import {
  activePrice,
  capacityLabel,
  CATEGORY_LABEL,
  featureAnchor,
  indicativeMonthly,
  isRemoteImage,
  jsonLd as toJsonLd,
  ksh,
  productImage,
  productPath,
  sectionOf,
  SECTIONS,
  stockState,
  type Section,
} from "@/lib/format";
import { productBySlug, publishedReviews, relatedProducts, zones } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";
import { productWaLink } from "@/lib/wa";

type Props = { params: Promise<{ section: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await productBySlug(slug);
  if (!p) return {};
  const { price } = activePrice(p);
  return {
    title: p.seoTitle || `${p.name} (${p.modelNumber}) Price Kenya – ${ksh(price)}`,
    description:
      p.metaDescription ||
      `${p.shortBenefit} Buy the ${p.name} (${p.modelNumber}) for ${ksh(price)} in Kenya. Delivery, installation, M-Pesa and Pay on Delivery.`,
    alternates: { canonical: productPath(p) },
    openGraph: { images: [productImage(p)] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { section, slug } = await params;
  if (!SECTIONS[section as Section]) notFound();
  const p = await productBySlug(slug);
  if (!p) notFound();
  if (sectionOf(p.category) !== section) permanentRedirect(productPath(p));

  const [s, related, reviews, zoneList, info] = await Promise.all([getSettings(), relatedProducts(p), publishedReviews(p.id, 6), zones(), getContent("productInfo")]);
  const { price, onOffer } = activePrice(p);
  const st = stockState(p);
  const wa = productWaLink(s.whatsapp, p);
  const isWasher = !!p.washCapacityKg;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const mainImage = productImage(p);
  const instalment = indicativeMonthly(price, s.financingRates);
  const topReview = reviews[0];
  const avg = reviews.length ? Math.round(reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) : 0;
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
      price,
      availability: p.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(onOffer && p.offerEnd ? { priceValidUntil: p.offerEnd.toISOString().slice(0, 10) } : {}),
    },
    ...(reviews.length
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: avg, reviewCount: reviews.length },
          review: reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            reviewRating: { "@type": "Rating", ratingValue: r.rating },
            reviewBody: r.body,
          })),
        }
      : {}),
  };

  const specs: [string, string | null][] = [
    ["Brand", p.brand],
    ["Model number", p.modelNumber],
    ["Category", CATEGORY_LABEL[p.category] ?? p.category],
    ["Type", p.type],
    ["Wash capacity", p.washCapacityKg ? `${p.washCapacityKg} kg` : null],
    ["Dry capacity", p.dryCapacityKg ? `${p.dryCapacityKg} kg` : null],
    ["Spin speed", p.spinRpm ? `${p.spinRpm} RPM` : null],
    ["Energy rating", p.energyRating],
    ["Motor", p.motor],
    ["Features", p.features.length ? p.features.join(", ") : null],
    ["Colour", p.colour],
    ["Dimensions (W × D × H)", p.dimensionsCm ? `${p.dimensionsCm} cm` : null],
    ["Weight", p.weightKg ? `${p.weightKg} kg` : null],
    ["Warranty", p.warranty],
  ];
  const shown = specs.filter((x): x is [string, string] => !!x[1]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <ViewItemTracker productId={p.id} value={price} />
      <ExitPrompt href={wa} />
      <div className="container-x py-4">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-600">
          <Link href="/" className="underline">Home</Link> / <Link href={`/${section}`} className="underline">{SECTIONS[section as Section].title}</Link> / {p.modelNumber}
        </nav>
        <div className="grid gap-6 lg:grid-cols-2">
          <Gallery images={p.images.length ? p.images : [productImage(p)]} alt={`${p.name} — ${p.modelNumber}`} />
          <div>
            <p className="text-sm font-semibold text-brand">{p.brand} · Model {p.modelNumber}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-brand-dark sm:text-3xl">{p.name}</h1>
            <p className="mt-2 text-slate-700">{p.shortBenefit}</p>
            {reviews.length > 0 && (
              <p className="mt-1 text-sm"><Stars n={avg} /> <span className="text-slate-600">({reviews.length} review{reviews.length > 1 ? "s" : ""})</span></p>
            )}
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-brand-dark">
                {ksh(price)}
                {onOffer && <span className="ml-2 text-lg font-normal text-slate-500 line-through">{ksh(p.priceKsh)}</span>}
              </p>
              {onOffer && (
                <p className="mt-1 text-sm font-semibold text-accent-dark">
                  {p.offerBadge || "Offer"}
                  {p.offerEnd ? ` · ends ${p.offerEnd.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              )}
              <p className="mt-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                {info.priceNote && <span className="ml-2 text-xs text-slate-500">{info.priceNote}</span>}
              </p>
              {instalment && (
                <p className="mt-2 text-sm text-slate-700">
                  Or from about <b>{ksh(instalment.monthly)}/month</b> over {instalment.months} months. Indicative only; our financing partner confirms terms.{" "}
                  <a href="#instalments" className="font-semibold text-brand underline">Ask us</a>
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <BuyButtons
                disabled={p.stockQty <= 0}
                p={{ productId: p.id, path: productPath(p), name: p.name, modelNumber: p.modelNumber, price, image: mainImage, max: p.stockQty, laundry: !!(p.washCapacityKg || p.dryCapacityKg) }}
              />
              <TrackedLink href={wa} event="whatsapp_click" productId={p.id} external className="btn btn-wa">💬 Order on WhatsApp</TrackedLink>
              <div className="grid grid-cols-3 gap-2">
                <TrackedLink href={`tel:${s.phoneTel}`} event="call_click" productId={p.id} className="btn btn-outline !px-2 !text-sm">📞 Call</TrackedLink>
                <a href="#book" className="btn btn-outline !px-2 !text-sm">📅 Showroom</a>
                <a href="#instalments" className="btn btn-outline !px-2 !text-sm">💳 Instalments</a>
              </div>
            </div>
            {topReview && (
              <figure className="mt-3 flex gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                {topReview.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topReview.imageUrl} alt={`Installed unit at ${topReview.name}'s home`} loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <Stars n={topReview.rating} />
                  <blockquote className="line-clamp-2 text-sm text-slate-700">“{topReview.body}”</blockquote>
                  <figcaption className="text-xs font-semibold text-slate-600">{topReview.name}{topReview.location ? `, ${topReview.location}` : ""}</figcaption>
                </div>
              </figure>
            )}
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

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-2">
            <h2 className="text-lg font-bold">Key specs</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Capacity", capacityLabel(p) || "—"],
                ["Spin", p.spinRpm ? `${p.spinRpm} RPM` : "—"],
                ["Energy", p.energyRating ?? "—"],
                ["Motor", p.motor.includes("BLDC") ? "BLDC inverter" : p.motor],
                ["Type", p.type],
                ["Warranty", p.warranty],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="text-sm font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <h2 className="mt-6 text-lg font-bold">About this machine</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{p.description}</p>
            {p.videoUrl && <VideoOnTap url={p.videoUrl} title={p.name} />}
          </div>
          <div className="card p-4">
            <h2 className="text-lg font-bold">Delivery & installation</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {zoneList.map((z) => (
                <li key={z.id} className="rounded-lg bg-slate-50 p-2">
                  <span className="block font-semibold">{z.name}</span>
                  <span className="text-slate-600">{z.fee === 0 ? "Free delivery" : `${ksh(z.fee)} delivery`} · {z.leadTime} · {z.installFee === 0 ? "free installation" : `install ${ksh(z.installFee)}`}</span>
                </li>
              ))}
            </ul>
            {isWasher && (
              <>
                <h3 className="mt-4 font-bold">Installation needs</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {info.installNeeds.split("\n").filter(Boolean).map((x) => <li key={x}>{x}</li>)}
                </ul>
              </>
            )}
            <h3 className="mt-4 font-bold">In the box</h3>
            <p className="text-sm text-slate-700">{info.inTheBox}</p>
          </div>
        </section>

        <section className="card mt-6 p-4">
          <h2 className="text-lg font-bold">Full specification</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {shown.map(([k, v]) => (
                <tr key={k} className="border-t border-slate-100">
                  <th scope="row" className="w-2/5 py-2 pr-3 text-left font-semibold text-slate-600">{k}</th>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {p.manualPdf && <p className="mt-3"><a href={p.manualPdf} className="font-semibold text-brand underline" target="_blank" rel="noopener noreferrer">⬇ Download manual / brochure</a></p>}
        </section>

        {reviews.length > 0 && (
          <section className="mt-8">
            <SectionTitle>Customer reviews</SectionTitle>
            <ReviewCards reviews={reviews} />
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div id="instalments" className="card scroll-mt-32 p-4">
            <h2 className="text-lg font-bold">Ask about instalments</h2>
            <p className="mb-3 mt-1 text-sm text-slate-600">Plans available — ask us. Our financing partner contacts you; approval is decided by the partner.</p>
            <LeadForm type="financing" fields={["plan", "employment"]} productId={p.id} productName={`${p.name} (${p.modelNumber})`} submitLabel="Request instalment plan" event="financing_submit" successMessage="Request received. Our team will call you about instalment plans." consentText="I consent to be contacted by the store and its financing partner about instalment plans." />
          </div>
          <div id="book" className="card scroll-mt-32 p-4">
            <h2 className="text-lg font-bold">Book a showroom visit</h2>
            <p className="mb-3 mt-1 text-sm text-slate-600">See this machine running at our showroom. {s.openingHours}</p>
            <LeadForm type="booking" fields={["date", "slot"]} productId={p.id} productName={`${p.name} (${p.modelNumber})`} submitLabel="Book my visit" event="booking_submit" successMessage="Booking received! We'll confirm by WhatsApp or SMS." />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <SectionTitle>Related products</SectionTitle>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} whatsapp={s.whatsapp} />
              ))}
            </div>
          </section>
        )}
        <p className="mt-6 text-xs text-slate-500">
          Need help deciding?{" "}
          <a className="underline" href={waLink(s.whatsapp, `Hi, I'd like help choosing between machines. I'm looking at ${p.modelNumber}.`)}>Chat with us</a>.
        </p>
      </div>
    </>
  );
}
