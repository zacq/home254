import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { getContent, isCustomised } from "@/lib/content";
import { BLOCKS, isBlockKey, type Block, type Item } from "@/lib/content-schema";
import { guard } from "@/lib/guard";
import { resetContent } from "../../actions";

export default async function EditContent({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guard("content");
  const { key } = await params;
  if (!isBlockKey(key)) notFound();
  const sp = await searchParams;
  const b: Block = BLOCKS[key];
  const [value, customised] = await Promise.all([getContent(key), isCustomised(key)]);
  return (
    <div className="grid gap-4">
      <Link href="/admin/content" className="text-sm font-semibold underline">← All content</Link>
      <h1 className="text-2xl font-extrabold text-brand-dark">{b.title}</h1>
      {b.description && <p className="text-sm text-slate-600">{b.description}</p>}
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved. The live site is updated.</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <ContentEditor key={`${customised}-${sp.saved}`} blockKey={key} fields={b.fields} itemLabel={b.kind === "list" ? b.itemLabel : undefined} initial={value as Item | Item[]} />
      {customised && (
        <form action={resetContent}>
          <input type="hidden" name="key" value={key} />
          <button className="text-sm font-semibold text-red-700 underline">Reset to the original text</button>
        </form>
      )}
    </div>
  );
}
