import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { Prose } from "@/components/Prose";
import { Quiz } from "@/components/Quiz";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Which Washing Machine Is Right for Me? Buying Guide & Quiz Kenya",
  description: "Choose the right washing machine, washer-dryer combo or dryer for your household size and space. Take the 60-second quiz or read the guide.",
  alternates: { canonical: "/which-machine" },
};

export default async function WhichMachinePage() {
  const [s, guide, faqs] = await Promise.all([getSettings(), getContent("guide"), getContent("faqs")]);
  return (
    <>
      <PageHeader title={guide.title} intro={guide.intro} />
      <div className="container-x grid gap-8 py-6 lg:grid-cols-2">
        <section aria-labelledby="quiz-h"><h2 id="quiz-h" className="sr-only">Quiz</h2><Quiz whatsapp={s.whatsapp} /></section>
        <section className="prose-p">
          <Prose body={guide.body} />
          <div className="mt-4 flex flex-wrap gap-2 not-prose">
            <Link href="/washers/front-load" className="btn btn-brand">Front-load washers</Link>
            <Link href="/washers/washer-dryers" className="btn btn-outline">Washer-dryers</Link>
            <Link href="/washers/tumble-dryers" className="btn btn-outline">Dryers</Link>
            <Link href="/washers/top-load" className="btn btn-outline">Top-load & twin-tub</Link>
          </div>
        </section>
      </div>
      <section className="container-x pb-6">
        <h2 className="mb-3 text-xl font-extrabold text-brand-dark">Common questions</h2>
        <div className="grid gap-2">
          {faqs.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="min-h-6 cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
