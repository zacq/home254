import { PageHeader } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { Prose } from "@/components/Prose";
import { TrackedLink } from "@/components/TrackedLink";
import { getContent } from "@/lib/content";
import { allProducts } from "@/lib/queries";
import { getRewardsConfig } from "@/lib/rewards";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = {
  title: "E-Warranty Registration & After-Sales Service",
  description: "Register your appliance warranty online, earn bonus Rewards points and request a technician.",
  alternates: { canonical: "/e-warranty" },
};

export default async function WarrantyPage() {
  const [page, faqs, s, all, cfg] = await Promise.all([getContent("warranty"), getContent("warrantyFaqs"), getSettings(), allProducts(), getRewardsConfig()]);
  const options = all.map((p) => ({ id: p.id, name: `${p.brand} ${p.modelNumber} — ${p.name}` }));
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <section id="register" className="card h-fit scroll-mt-32 p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Register a warranty</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">
            Use your order number, or the serial number for in-store purchases. Members get <b>{cfg.warrantyBonus} bonus points</b> once we&apos;ve checked it.
          </p>
          <LeadForm type="warranty" fields={["product", "orderRef", "serial", "purchaseDate", "email"]} productOptions={options} submitLabel="Register my warranty" successMessage="Registered. Send a photo of your receipt on WhatsApp if you bought in store." />
          <TrackedLink href={waLink(s.whatsapp, "Hi, here is my receipt for warranty registration:")} event="whatsapp_click" external className="btn btn-wa mt-3 w-full">
            💬 Send receipt photo on WhatsApp
          </TrackedLink>
        </section>
        <section id="service" className="card h-fit scroll-mt-32 p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Request service</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Tell us what is wrong and we&apos;ll call you within one working day to book a technician.</p>
          <LeadForm type="service" fields={["product", "orderRef", "issue"]} productOptions={options} submitLabel="Request a technician" successMessage="Request received. We'll call you to book a visit." />
        </section>
      </div>
      <div className="container-x grid gap-6 pb-6">
        <section className="card prose-p p-5"><Prose body={page.body} /></section>
        <section>
          <h2 className="mb-3 text-xl font-extrabold text-brand-dark">Questions</h2>
          <div className="grid gap-2">
            {faqs.map((f) => (
              <details key={f.q} className="card p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
