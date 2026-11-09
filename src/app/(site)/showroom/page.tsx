import Image from "next/image";
import { PageHeader, ReviewCards, SectionTitle } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { getContent } from "@/lib/content";
import { isRemoteImage } from "@/lib/format";
import { allProducts, publishedReviews } from "@/lib/queries";

export const metadata = {
  title: "Store Locator, Showroom Visits & Customer Reviews",
  description: "Find a NyumbaniAppliances store, book a showroom visit to see appliances running, and read verified customer reviews.",
  alternates: { canonical: "/showroom" },
};

export default async function ShowroomPage() {
  const [all, reviews, blocks, branches] = await Promise.all([allProducts(), publishedReviews(undefined, 12), getContent("homeBlocks"), getContent("branches")]);
  return (
    <>
      <PageHeader title="Stores & showroom" intro="Find a store near you, see appliances running and be sure before you pay." />
      <div className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <section className="grid h-fit gap-4" aria-labelledby="stores-h">
          <h2 id="stores-h" className="sr-only">Our stores</h2>
          {branches.map((b) => (
            <div key={b.name} className="card overflow-hidden">
              <div className="p-4 text-sm">
                <h3 className="text-lg font-extrabold text-brand-dark">📍 {b.name}</h3>
                <p className="mt-1 whitespace-pre-line">{b.address}</p>
                {b.hours && <p className="mt-1 text-slate-600">{b.hours}</p>}
                {b.phone && <p className="mt-1"><a className="font-semibold text-brand underline" href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a></p>}
                <a className="mt-2 inline-block font-semibold text-brand underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapQuery || b.address)}`}>Directions</a>
              </div>
              <iframe title={`Map: ${b.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-56 w-full border-0" src={`https://www.google.com/maps?q=${encodeURIComponent(b.mapQuery || b.address)}&output=embed`} />
            </div>
          ))}
          {blocks.showroomImage && <Image src={blocks.showroomImage} alt="Our showroom with appliances on display" width={720} height={460} sizes="(max-width:1024px) 100vw, 50vw" loading="lazy" unoptimized={isRemoteImage(blocks.showroomImage)} className="w-full rounded-2xl object-cover" />}
        </section>
        <section id="book" className="card h-fit scroll-mt-32 p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Book a showroom visit</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Pick a day and time slot — we&apos;ll confirm by WhatsApp or SMS.</p>
          <LeadForm type="booking" fields={["product", "date", "slot"]} productOptions={all.map((p) => ({ id: p.id, name: `${p.name} (${p.modelNumber})` }))} submitLabel="Book my visit" event="booking_submit" successMessage="Booking received! We'll confirm by WhatsApp or SMS." />
        </section>
      </div>
      <section id="reviews" className="container-x scroll-mt-32 pb-6">
        <SectionTitle>Customer reviews</SectionTitle>
        {reviews.length ? <ReviewCards reviews={reviews} /> : <p className="card p-5 text-sm text-slate-600">Verified reviews from customers whose orders were delivered will appear here.</p>}
      </section>
    </>
  );
}
