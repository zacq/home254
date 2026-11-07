import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { getContent } from "@/lib/content";

export const metadata = { title: "Privacy Policy", description: "How we collect and use personal data under the Kenya Data Protection Act, 2019.", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const page = await getContent("privacy");
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="container-x prose-p max-w-3xl py-6"><Prose body={page.body} /></div>
    </>
  );
}
