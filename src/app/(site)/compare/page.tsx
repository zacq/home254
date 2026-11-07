import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/Bits";
import { CompareRemove } from "@/components/Compare";
import { TrackedLink } from "@/components/TrackedLink";
import type { Product } from "@/db/schema";
import { activePrice, capacityLabel, isRemoteImage, ksh, MAX_COMPARE, productImage, productPath } from "@/lib/format";
import { productsByIds } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { productWaLink } from "@/lib/wa";

export const metadata = { title: "Compare machines", robots: { index: false } };

const ROWS: [string, (p: Product) => string][] = [
  ["Price", (p) => ksh(activePrice(p).price)],
  ["Capacity (wash/dry)", (p) => capacityLabel(p) || "—"],
  ["Type", (p) => p.type],
  ["Spin speed", (p) => (p.spinRpm ? `${p.spinRpm} RPM` : "—")],
  ["Energy rating", (p) => p.energyRating ?? "—"],
  ["Motor", (p) => p.motor],
  ["Steam wash", (p) => (p.features.includes("SpaCare steam wash") ? "Yes" : "No")],
  ["Warranty", (p) => p.warranty],
  ["Dimensions (W × D × H)", (p) => (p.dimensionsCm ? `${p.dimensionsCm} cm` : "—")],
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const wanted = [...new Set(ids.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAX_COMPARE);
  const [s, list] = await Promise.all([getSettings(), productsByIds(wanted)]);

  return (
    <>
      <PageHeader title="Compare machines" intro={`Compare up to ${MAX_COMPARE} machines side by side. Differences are highlighted.`} />
      <div className="container-x py-6">
        {list.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-bold">Nothing to compare yet.</p>
            <p className="mt-1 text-sm text-slate-600">Tick “Add to compare” on any machine.</p>
            <Link href="/washing-machines" className="btn btn-primary mt-3">Browse washing machines</Link>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[34rem] table-fixed text-sm">
              <thead>
                <tr>
                  <td className="w-32 p-3" />
                  {list.map((p) => (
                    <th key={p.id} scope="col" className="p-3 text-left align-top font-normal">
                      <Image src={productImage(p)} alt="" width={200} height={200} unoptimized={isRemoteImage(productImage(p))} className="aspect-square w-full max-w-40 rounded-lg object-cover" />
                      <Link href={productPath(p)} className="mt-2 block font-bold leading-snug hover:text-brand">{p.name}</Link>
                      <span className="block text-xs text-slate-500">{p.modelNumber}</span>
                      <CompareRemove id={p.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, value]) => {
                  const differs = new Set(list.map(value)).size > 1;
                  return (
                    <tr key={label} className="border-t border-slate-100">
                      <th scope="row" className="p-3 text-left font-semibold text-slate-600">{label}</th>
                      {list.map((p) => (
                        <td key={p.id} className={`p-3 align-top ${differs ? "bg-amber-50 font-semibold" : ""}`}>{value(p)}</td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t border-slate-100">
                  <td className="p-3" />
                  {list.map((p) => (
                    <td key={p.id} className="grid gap-2 p-3">
                      <Link href={productPath(p)} className="btn btn-primary !text-sm">View & buy</Link>
                      <TrackedLink href={productWaLink(s.whatsapp, p)} event="whatsapp_click" productId={p.id} external className="btn btn-wa !text-sm">💬 WhatsApp</TrackedLink>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
