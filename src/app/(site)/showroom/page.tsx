import Image from "next/image";
import { PageHeader, ReviewCards, SectionTitle } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { getContent } from "@/lib/content";
import { isRemoteImage } from "@/lib/format";
import { allProducts, publishedReviews } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Showroom & Customer Reviews | See Washing Machines in Nairobi",
  description: "Visit our showroom to see washing machines, combos and dryers running. Book a visit, find our hours and read customer reviews.",
  alternates: { canonical: "/showroom" },
};

export default async function ShowroomPage() {
  const [s, all, reviews, blocks] = await Promise.all([getSettings(), allProducts(), publishedReviews(undefined, 12), getContent("homeBlocks")]);
  return (
    <>
      <PageHeader title="Showroom & reviews" intro="See the machines running, ask your questions and be sure before you pay." />
      <div className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <section className="grid gap-4">
          {blocks.showroomImage && <Image src={blocks.showroomImage} alt="Showroom floor with washing machines and dryers" width={720} height={460} sizes="(max-width:1024px) 100vw, 50vw" unoptimized={isRemoteImage(blocks.showroomImage)} className="w-full rounded-2xl object-cover" />}
          <div className="card p-4 text-sm">
            <h2 className="text-lg font-extrabold text-brand-dark">Find us</h2>
            <p className="mt-2">{s.showroomAddress}</p>
            <p className="mt-1">{s.openingHours}</p>
          </div>
          <iframe title="Showroom map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full rounded-2xl border-0" src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapQuery)}&output=embed`} />
        </section>
        <section id="book" className="card h-fit scroll-mt-32 p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Book a showroom visit</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Pick a day and time slot — we&apos;ll confirm by WhatsApp or SMS.</p>
          <LeadForm type="booking" fields={["product", "date", "slot"]} productOptions={all.map((p) => ({ id: p.id, name: `${p.name} (${p.modelNumber})` }))} submitLabel="Book my visit" event="booking_submit" successMessage="Booking received! We'll confirm by WhatsApp or SMS." />
        </section>
      </div>
      <section id="reviews" className="container-x scroll-mt-32 pb-6">
        <SectionTitle>Customer reviews</SectionTitle>
        {reviews.length ? <ReviewCards reviews={reviews} /> : <p className="card p-5 text-sm text-slate-600">Customer reviews and photos of installed machines will appear here as buyers share them.</p>}
      </section>
    </>
  );
}
