import Image from "next/image";
import Link from "next/link";
import { ReviewCards, SectionTitle, TrustStrip } from "@/components/Bits";
import { ProductCard } from "@/components/ProductCard";
import { TrackedLink } from "@/components/TrackedLink";
import { getContent } from "@/lib/content";
import { activePrice, isRemoteImage } from "@/lib/format";
import { allProducts, featuredProducts, publishedReviews } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = {
  title: "Premium Washing Machines & Washer-Dryer Combos Kenya | MIKA",
  description:
    "Buy premium MIKA front-load washers, washer-dryer combos and heat-pump dryers in Kenya. Free delivery & installation in zones, M-Pesa, Pay on Delivery and instalments.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [s, featured, all, reviews, hero, banners, trust, tiles, blocks] = await Promise.all([
    getSettings(),
    featuredProducts(),
    allProducts(),
    publishedReviews(undefined, 3),
    getContent("hero"),
    getContent("banners"),
    getContent("trust"),
    getContent("tiles"),
    getContent("homeBlocks"),
  ]);
  const offers = all.filter((p) => activePrice(p).onOffer).slice(0, 4);
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-dark text-white">
        {hero.image && <Image src={hero.image} alt="" fill priority sizes="100vw" unoptimized={isRemoteImage(hero.image)} className="-z-10 object-cover opacity-40" />}
        <div className="container-x py-14 sm:py-24">
          {hero.eyebrow && <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{hero.eyebrow}</p>}
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">{hero.heading}</h1>
          <p className="mt-4 max-w-xl text-base text-slate-100 sm:text-lg">{hero.subheading}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={hero.primaryHref || "/washing-machines"} className="btn btn-primary !px-6">{hero.primaryLabel}</Link>
            {hero.secondaryLabel && (
              <TrackedLink href={waLink(s.whatsapp, hero.whatsappMessage)} event="whatsapp_click" external className="btn btn-wa !px-6">
                💬 {hero.secondaryLabel}
              </TrackedLink>
            )}
          </div>
        </div>
      </section>

      <TrustStrip items={trust} />

      {banners.length > 0 && (
        <section className="container-x grid gap-3 py-3 lg:grid-cols-2">
          {banners.map((b, n) => (
            <div key={n} className="card grid overflow-hidden sm:grid-cols-[1fr_12rem]">
              <div className="p-5">
                <h2 className="text-xl font-extrabold text-brand-dark">{b.title}</h2>
                {b.text && <p className="mt-1 text-sm text-slate-700">{b.text}</p>}
                {b.ctaLabel && b.ctaHref && <Link href={b.ctaHref} className="btn btn-primary mt-3">{b.ctaLabel}</Link>}
              </div>
              {b.image && <Image src={b.image} alt="" width={400} height={300} sizes="(max-width:640px) 100vw, 12rem" unoptimized={isRemoteImage(b.image)} className="h-full w-full object-cover" />}
            </div>
          ))}
        </section>
      )}

      <section className="container-x py-6">
        <SectionTitle>Shop by category</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link key={t.href + t.label} href={t.href || "/"} className="card group overflow-hidden">
              {t.image && <Image src={t.image} alt="" width={400} height={300} sizes="(max-width:1024px) 50vw, 25vw" unoptimized={isRemoteImage(t.image)} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />}
              <span className="block p-3">
                <span className="block font-bold">{t.label}</span>
                <span className="block text-xs text-slate-600">{t.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x py-6">
        <SectionTitle href="/washing-machines" link="All washers">Featured models</SectionTitle>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3">
          {featured.map((p) => (
            <div key={p.id} className="w-64 shrink-0 snap-start sm:w-72">
              <ProductCard p={p} whatsapp={s.whatsapp} />
            </div>
          ))}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="container-x py-6">
          <SectionTitle>Current offers</SectionTitle>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {offers.map((p) => (
              <ProductCard key={p.id} p={p} whatsapp={s.whatsapp} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-6">
        <div className="grid gap-4 rounded-3xl bg-brand p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold">{blocks.quizHeading}</h2>
            <p className="mt-1 text-slate-100">{blocks.quizText}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/which-machine" className="btn btn-primary">Take the quiz</Link>
            <Link href="/technology" className="btn bg-white/15 text-white hover:bg-white/25">What do the features mean?</Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="container-x py-6">
          <SectionTitle href="/showroom#reviews">What customers say</SectionTitle>
          <ReviewCards reviews={reviews} />
        </section>
      )}

      <section className="container-x py-6">
        <div className="card grid gap-4 overflow-hidden sm:grid-cols-2">
          {blocks.showroomImage && <Image src={blocks.showroomImage} alt="Our showroom with washers and dryers on display" width={700} height={450} sizes="(max-width:640px) 100vw, 50vw" unoptimized={isRemoteImage(blocks.showroomImage)} className="h-full w-full object-cover" />}
          <div className="p-5">
            <h2 className="text-xl font-extrabold text-brand-dark">{blocks.showroomHeading}</h2>
            <p className="mt-2 text-slate-700">{blocks.showroomText}</p>
            <p className="mt-2 text-sm text-slate-600">{s.showroomAddress}<br />{s.openingHours}</p>
            <Link href="/showroom#book" className="btn btn-brand mt-4">Book a showroom visit</Link>
          </div>
        </div>
      </section>
    </>
  );
}
