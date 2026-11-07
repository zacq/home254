import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "About Us", description: "Who we are and how we sell premium laundry appliances in Kenya.", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const [s, page] = await Promise.all([getSettings(), getContent("about")]);
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x prose-p max-w-3xl py-6">
        <Prose body={page.body} />
        <h2>Dealer status</h2>
        <p>{s.dealerStatement}</p>
      </div>
    </>
  );
}
