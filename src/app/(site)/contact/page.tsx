import { PageHeader } from "@/components/Bits";
import { LeadForm } from "@/components/LeadForm";
import { TrackedLink } from "@/components/TrackedLink";
import { getSettings, waLink } from "@/lib/settings";

export const metadata = {
  title: "Contact Us | Call, WhatsApp or Visit",
  description: "Call, WhatsApp, email or visit our showroom. Send an enquiry and our sales team will reply quickly.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Contact us" intro="We reply to WhatsApp fastest — usually within 15 minutes in opening hours." />
      <div className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <section className="grid h-fit gap-3">
          <TrackedLink href={waLink(s.whatsapp, "Hi, I have a question.")} event="whatsapp_click" external className="btn btn-wa">💬 WhatsApp us</TrackedLink>
          <TrackedLink href={`tel:${s.phoneTel}`} event="call_click" className="btn btn-brand">📞 Call {s.phoneDisplay}</TrackedLink>
          <a href={`mailto:${s.email}`} className="btn btn-outline">✉️ {s.email}</a>
          <div className="card p-4 text-sm"><p className="font-bold">Showroom</p><p>{s.showroomAddress}</p><p>{s.openingHours}</p></div>
          <iframe title="Map" loading="lazy" className="h-56 w-full rounded-2xl border-0" src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapQuery)}&output=embed`} />
        </section>
        <section className="card p-5">
          <h2 className="text-xl font-extrabold text-brand-dark">Send an enquiry</h2>
          <div className="mt-4"><LeadForm type="contact" fields={["email", "message"]} submitLabel="Send enquiry" successMessage="Thanks — we'll get back to you shortly." /></div>
        </section>
      </div>
    </>
  );
}
