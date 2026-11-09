import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { getContent } from "@/lib/content";
import { isRemoteImage } from "@/lib/format";
import { allProducts, hasFeature } from "@/lib/queries";

export const metadata = {
  title: "Washing Machine Technology Explained: SpaCare, BLDC Inverter, Heat Pump",
  description:
    "What do SpaCare steam wash, BLDC inverter motors, A+++ energy ratings and heat-pump drying actually do? Plain-language explainers for Kenyan buyers.",
  alternates: { canonical: "/technology" },
};

const FILTER_FOR: Record<string, string> = { "SpaCare steam wash": "steam=1", "Inverter motor": "inverter=1", "Dryer function": "dryer=1" };
const machinesHref = (tag: string) =>
  tag === "Heat pump" ? "/washers/tumble-dryers?type=Heat-pump+dryer" : FILTER_FOR[tag] ? `/washers?${FILTER_FOR[tag]}` : `/search?q=${encodeURIComponent(tag)}`;

export default async function TechnologyPage() {
  const [tech, all] = await Promise.all([getContent("tech"), allProducts()]);
  return (
    <>
      <PageHeader title="Technology explained" intro="Feature labels on a washing machine can sound like jargon. Here is what each one does, in plain language, and why it matters for your laundry and your bills." />
      <div className="container-x grid gap-4 py-6">
        <nav aria-label="Features" className="flex flex-wrap gap-2">
          {tech.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm font-semibold text-brand shadow-sm ring-1 ring-slate-200">{t.icon} {t.name}</a>
          ))}
        </nav>
        {tech.map((t) => {
          const count = t.tag ? all.filter((p) => hasFeature(p, t.tag)).length : 0;
          return (
            <section key={t.id} id={t.id} className="card scroll-mt-32 grid gap-4 p-5 sm:grid-cols-[8rem_1fr]">
              {t.image ? (
                <Image src={t.image} alt={t.name} width={224} height={224} unoptimized={isRemoteImage(t.image)} className="h-28 w-28 rounded-2xl object-cover" />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-2xl bg-brand-light text-5xl" aria-hidden>{t.icon}</div>
              )}
              <div>
                <h2 className="text-xl font-extrabold text-brand-dark">{t.name}</h2>
                <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">What it does</h3>
                <p className="text-slate-700">{t.what}</p>
                <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">The benefit</h3>
                <p className="text-slate-700">{t.benefit} {t.benefitLabel && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{t.benefitLabel}</span>}</p>
                {t.tag && (
                  <Link href={machinesHref(t.tag)} className="btn btn-outline mt-3 !text-sm">
                    See machines with this feature{count ? ` (${count})` : ""}
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
