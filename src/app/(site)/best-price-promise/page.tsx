import { PageHeader } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { Prose } from "@/components/Prose";
import { TrackedLink } from "@/components/TrackedLink";
import { getContent } from "@/lib/content";
import { allProducts } from "@/lib/queries";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = {
  title: "Best Price Promise: We Match Lower Advertised Prices",
  description: "Found a lower advertised price for the same appliance in Kenya? Send it to us and we'll match it within 24 hours, and you still earn points.",
  alternates: { canonical: "/best-price-promise" },
};

export default async function BestPricePage() {
  const [page, s, all] = await Promise.all([getContent("bestPrice"), getSettings(), allProducts()]);
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <section className="card prose-p h-fit p-5"><Prose body={page.body} /></section>
        <section className="card h-fit p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Request a price match</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">We reply within 24 hours with a one-time price code for checkout.</p>
          <LeadForm
            type="price_match"
            fields={["product", "competitor", "advertisedPrice", "link"]}
            productOptions={all.map((p) => ({ id: p.id, name: `${p.brand} ${p.modelNumber} — ${p.name}` }))}
            submitLabel="Send price-match request"
            event="price_match_request"
            successMessage="Request received. We'll check it and send your price code within 24 hours."
          />
          <TrackedLink href={waLink(s.whatsapp, "Hi, I found a lower price for a product. Here is the photo:")} event="whatsapp_click" external className="btn btn-wa mt-3 w-full">
            💬 Or send a photo on WhatsApp
          </TrackedLink>
        </section>
      </div>
    </>
  );
}
