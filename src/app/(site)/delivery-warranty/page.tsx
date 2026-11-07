import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { getContent } from "@/lib/content";
import { ksh } from "@/lib/format";
import { zones } from "@/lib/queries";

export const metadata = {
  title: "Delivery, Installation & Warranty",
  description: "Delivery zones and fees, installation requirements, warranty terms including 10-year motor warranty where applicable, and after-sales support.",
  alternates: { canonical: "/delivery-warranty" },
};

export default async function DeliveryPage() {
  const [z, page] = await Promise.all([zones(), getContent("delivery")]);
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x grid gap-6 py-6">
        <section className="card overflow-x-auto p-4">
          <h2 className="text-lg font-extrabold text-brand-dark">Delivery zones & fees</h2>
          <table className="mt-3 w-full min-w-[32rem] text-left text-sm">
            <thead><tr className="border-b text-slate-600"><th className="py-2">Zone</th><th>Delivery</th><th>Installation</th><th>Lead time</th><th>Pay on Delivery</th></tr></thead>
            <tbody>
              {z.map((x) => (
                <tr key={x.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-semibold">{x.name}</td>
                  <td>{x.fee ? ksh(x.fee) : "Free"}</td>
                  <td>{x.installFee ? ksh(x.installFee) : "Free"}</td>
                  <td>{x.leadTime}</td>
                  <td>{x.podAllowed ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Outside these zones? Message us on WhatsApp for a manual quote.</p>
        </section>
        <section className="card prose-p p-5"><Prose body={page.body} /></section>
      </div>
    </>
  );
}
