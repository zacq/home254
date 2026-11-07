import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { getContent } from "@/lib/content";
import { ksh } from "@/lib/format";
import { allProducts, zones } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Payment Options: M-Pesa, Pay on Delivery & Instalments",
  description: "Pay for your washing machine with M-Pesa Till, Pay on Delivery in eligible zones, or ask about instalment plans through our financing partner.",
  alternates: { canonical: "/payment-options" },
};

export default async function PaymentPage() {
  const [s, z, all, page] = await Promise.all([getSettings(), zones(), allProducts(), getContent("payment")]);
  const pod = z.filter((x) => x.podAllowed);
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x grid gap-5 py-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-brand-dark">M-Pesa</h2>
          <p className="mt-2 text-sm text-slate-700">Pay to our {s.paymentLabel}: <b>{s.tillNumber}</b>. Use your order number (e.g. ORD-2026-00123) as the reference, then enter the M-Pesa confirmation code on your order page. We confirm payment and schedule delivery.</p>
          <p className="mt-2 text-sm text-slate-700">Orders of {ksh(Number(s.depositThreshold))} and above may require a {s.depositPct}% deposit upfront.</p>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-brand-dark">Pay on Delivery</h2>
          <p className="mt-2 text-sm text-slate-700">Available for orders up to {ksh(Number(s.podCap))} in these areas. We confirm with a call first; you pay by M-Pesa when the machine arrives.</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {pod.map((x) => <li key={x.id}>{x.name}</li>)}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-brand-dark">Instalments</h2>
          <p className="mt-2 text-sm text-slate-700">{page.instalments}</p>
        </section>
      </div>
      <section id="instalments" className="container-x pb-6">
        <div className="card mx-auto max-w-2xl scroll-mt-32 p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Ask about instalments</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Tell us what you&apos;d like to buy and we&apos;ll call you.</p>
          <LeadForm type="financing" fields={["product", "plan", "employment"]} productOptions={all.map((p) => ({ id: p.id, name: `${p.name} (${p.modelNumber})` }))} submitLabel="Request instalment plan" event="financing_submit" successMessage="Request received. Our team will call you about instalment plans." consentText="I consent to be contacted by the store and its financing partner about instalment plans." />
        </div>
        <p className="mt-4 text-center text-sm">Prefer to talk? <Link href="/contact" className="font-semibold text-brand underline">Contact us</Link></p>
      </section>
    </>
  );
}
