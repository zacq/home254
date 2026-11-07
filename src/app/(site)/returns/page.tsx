import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { getContent } from "@/lib/content";

export const metadata = { title: "Returns & Refunds", description: "Our returns and refunds policy for appliances.", alternates: { canonical: "/returns" } };

export default async function ReturnsPage() {
  const page = await getContent("returns");
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x prose-p max-w-3xl py-6"><Prose body={page.body} /></div>
    </>
  );
}
