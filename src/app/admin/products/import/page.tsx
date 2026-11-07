import Link from "next/link";
import { guard } from "@/lib/guard";
import { importProducts } from "../../actions";

export default async function ImportProducts({ searchParams }: { searchParams: Promise<{ created?: string; updated?: string; problems?: string }> }) {
  await guard("content");
  const sp = await searchParams;
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Link href="/admin/products" className="text-sm font-semibold underline">← Products</Link>
      <h1 className="text-2xl font-extrabold text-brand-dark">Import products from CSV</h1>
      {sp.created !== undefined && (
        <div role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">✓ {sp.created} added, {sp.updated} updated.</p>
          {sp.problems && <pre className="mt-2 whitespace-pre-wrap text-red-800">{sp.problems}</pre>}
        </div>
      )}
      <div className="card grid gap-2 p-4 text-sm text-slate-700">
        <p>Easiest way: <a className="font-semibold underline" href="/api/admin/export/products">export the current CSV</a>, edit it in Excel or Google Sheets, then upload it here.</p>
        <p>Rows are matched on <b>modelNumber</b>. A matching row is updated; a new one is added. Columns you leave out are not changed, so a file with only <code>modelNumber,priceKsh,stockQty</code> updates prices and stock.</p>
        <p>New products need <code>name</code>, <code>category</code> and <code>priceKsh</code>. Categories: washers, combos, dryers, fridges, microwaves, entry-washers. Separate multiple <code>features</code> or <code>images</code> with <code>|</code>.</p>
      </div>
      <form action={importProducts} className="card grid gap-3 p-4">
        <div>
          <label className="label" htmlFor="file">CSV file (under 1 MB)</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="input" />
        </div>
        <button className="btn btn-primary w-fit">Import</button>
      </form>
    </div>
  );
}
