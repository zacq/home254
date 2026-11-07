import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { getContent } from "@/lib/content";

export const metadata = { title: "Terms of Sale", description: "Terms of sale for orders placed with us.", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const page = await getContent("terms");
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x prose-p max-w-3xl py-6"><Prose body={page.body} /></div>
    </>
  );
}
