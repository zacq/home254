import Image from "next/image";
import Link from "next/link";
import { ReviewCards, SectionTitle, TrustStrip } from "@/components/Bits";
import { Countdown } from "@/components/Countdown";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { getContent } from "@/lib/content";
import { isRemoteImage, priceInfo } from "@/lib/format";
import { allProducts, getCategoryTree, onOfferProducts, publishedReviews } from "@/lib/queries";
import { getRewardsConfig, TIER_LABEL, TIERS } from "@/lib/rewards";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: { absolute: "NyumbaniAppliances | TVs, Fridges, Washers & Cookers at the Best Price in Kenya" },
  description:
    "Shop TVs, soundbars, fridges, washing machines, cookers and home appliances in Kenya at or below the market price. Earn Rewards points on every purchase, with delivery, M-Pesa and Pay on Delivery.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [s, tree, all, reviews, slides, banners, trust, blocks, branches, cfg] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    allProducts(),
    publishedReviews(undefined, 3),
    getContent("slides"),
    getContent("banners"),
    getContent("trust"),
    getContent("homeBlocks"),
    getContent("branches"),
    getRewardsConfig(),
  ]);
  const core = tree.filter((c) => c.isCore);
  const others = tree.filter((c) => !c.isCore);
  const deals = onOfferProducts(all.filter((p) => p.stockQty > 0));
  const bestSellers = all.filter((p) => p.stockQty > 0).slice(0, 8);
  const brands = [...new Set(all.map((p) => p.brand))].sort();

  return (
    <>
      <HeroSlider slides={slides} />
      <TrustStrip items={trust} />

      <section className="container-x py-4" aria-labelledby="core-h">
        <h2 id="core-h" className="sr-only">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {core.map((c, i) => (
            <Link key={c.slug} href={c.path} className={`card group overflow-hidden ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
              <Image src={c.image} alt="" width={400} height={300} sizes="(max-width:640px) 50vw, 20vw" unoptimized={isRemoteImage(c.image)} className="aspect-[4/3] w-full bg-brand-light object-contain p-4 transition group-hover:scale-105" />
              <span className="block p-3">
                <span className="block text-lg font-extrabold text-brand-dark">{c.name}</span>
                <span className="block text-xs text-slate-600">{c.count} products</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-9">
          {others.map((c) => (
            <Link key={c.slug} href={c.path} className="card p-2 text-center hover:shadow-md">
              <Image src={c.image} alt="" width={64} height={64} loading="lazy" unoptimized={isRemoteImage(c.image)} className="mx-auto h-12 w-12 object-contain" />
              <span className="mt-1 block text-xs font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

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

      {core.map((c) => {
        const row = deals.filter((p) => p.category === c.slug).slice(0, 4);
        if (!row.length) return null;
        const ends = row.map((p) => (priceInfo(p).onOffer ? p.offerEnd : null)).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0];
        return (
          <section key={c.slug} className="container-x py-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">
                {c.name} deals {ends && <Countdown end={ends.toISOString()} className="ml-2 rounded-full bg-red-600 px-3 py-1 align-middle text-xs font-bold text-white" />}
              </h2>
              <Link href={`/deals?category=${c.slug}`} className="text-sm font-semibold text-brand underline">All {c.name.toLowerCase()} deals</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {row.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        );
      })}

      <section className="container-x py-6" aria-labelledby="rewards-h">
        <div className="grid gap-4 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 p-6 text-amber-950 sm:p-8 lg:grid-cols-[1.2fr_2fr] lg:items-center">
          <div>
            <h2 id="rewards-h" className="text-2xl font-extrabold">{cfg.name}</h2>
            <p className="mt-1">Join free and get {cfg.signupBonus} welcome points.</p>
            <Link href="/rewards" className="btn mt-4 bg-amber-950 text-white hover:bg-black">Join free, start earning</Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            <li className="rounded-2xl bg-white/80 p-4"><b className="block">1. Earn</b><span className="text-sm">{cfg.rate.bronze} point for every KSh 100 you spend, more in higher tiers.</span></li>
            <li className="rounded-2xl bg-white/80 p-4">
              <b className="block">2. Climb tiers</b>
              <span className="mt-1 flex flex-wrap gap-1">{TIERS.map((t) => <span key={t} className="rounded bg-amber-950/10 px-1.5 text-xs font-bold">{TIER_LABEL[t]}</span>)}</span>
              <span className="text-sm">Up to {cfg.rate.platinum} points per KSh 100 and free delivery.</span>
            </li>
            <li className="rounded-2xl bg-white/80 p-4"><b className="block">3. Redeem</b><span className="text-sm">1 point = KSh 1 off your next order at checkout.</span></li>
          </ol>
        </div>
      </section>

      <section className="container-x py-5">
        <SectionTitle href="/deals" link="See all deals">Best sellers</SectionTitle>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3">
          {bestSellers.map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-64">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-5" aria-labelledby="brands-h">
        <h2 id="brands-h" className="mb-3 text-xl font-extrabold text-brand-dark sm:text-2xl">Shop by brand</h2>
        <ul className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <li key={b}><Link href={`/search?q=${encodeURIComponent(b)}`} className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 font-extrabold text-slate-700 ring-1 ring-slate-200 hover:ring-brand">{b}</Link></li>
          ))}
        </ul>
      </section>

      {reviews.length > 0 && (
        <section className="container-x py-6">
          <SectionTitle href="/showroom#reviews">What customers say</SectionTitle>
          <ReviewCards reviews={reviews} />
        </section>
      )}

      <section className="container-x py-6">
        <div className="card grid gap-4 overflow-hidden sm:grid-cols-2">
          {blocks.showroomImage && <Image src={blocks.showroomImage} alt="Our store with appliances on display" width={700} height={450} sizes="(max-width:640px) 100vw, 50vw" loading="lazy" unoptimized={isRemoteImage(blocks.showroomImage)} className="h-full w-full object-cover" />}
          <div className="p-5">
            <h2 className="text-xl font-extrabold text-brand-dark">{blocks.showroomHeading}</h2>
            <p className="mt-2 text-slate-700">{blocks.showroomText}</p>
            <ul className="mt-2 text-sm text-slate-600">
              {branches.slice(0, 3).map((b) => <li key={b.name}><b>{b.name}</b> · {b.address}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/showroom" className="btn btn-brand">📍 Find a store</Link>
              <Link href="/which-machine" className="btn btn-outline">{blocks.quizHeading}</Link>
            </div>
            <p className="mt-2 text-xs text-slate-500">{s.openingHours}</p>
          </div>
        </div>
      </section>
    </>
  );
}
