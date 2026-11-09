import { ImageField } from "@/components/admin/ImageField";
import { guard } from "@/lib/guard";
import { getCategoryTree, MIN_SUB_PRODUCTS, type MenuCat, type MenuSub } from "@/lib/queries";
import { addSubcategory, saveCategory } from "../actions";

function CatForm({ c }: { c: MenuCat }) {
  return (
    <form action={saveCategory} id={c.slug} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr] sm:items-end">
      <input type="hidden" name="slug" value={c.slug} />
      <div><label className="label">Name</label><input name="name" required defaultValue={c.name} className="input" /></div>
      <div><label className="label">Menu order</label><input name="menuOrder" type="number" defaultValue={c.order} className="input" /></div>
      <div><label className="label">Margin floor %</label><input name="marginFloorPct" type="number" defaultValue={c.marginFloorPct} className="input" /></div>
      <div className="sm:col-span-3"><label className="label">SEO intro (shown under the page title)</label><textarea name="intro" rows={2} defaultValue={c.intro} className="input" /></div>
      <div className="sm:col-span-3"><p className="label">Tile image</p><ImageField name="tileImage" value={[c.image]} /></div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="isCore" defaultChecked={c.isCore} className="h-5 w-5" /> Core category (large homepage tile)</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c.active} className="h-5 w-5" /> Shown in menu</label>
        <span className="text-xs text-slate-500">{c.count} products · /{c.slug}</span>
        <button className="btn btn-brand ml-auto">Save {c.name}</button>
      </div>
    </form>
  );
}

function SubForm({ parent, s }: { parent: string; s: MenuSub }) {
  return (
    <form action={saveCategory} id={`${parent}/${s.slug}`} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
      <input type="hidden" name="slug" value={`${parent}/${s.slug}`} />
      <input type="hidden" name="parent" value={parent} />
      <div><label className="label">Sub-category</label><input name="name" required defaultValue={s.name} className="input" /></div>
      <div><label className="label">Order</label><input name="menuOrder" type="number" defaultValue={s.order} className="input" /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.active} className="h-5 w-5" /> Active</label>
      <div className="sm:col-span-3"><label className="label">Intro</label><textarea name="intro" rows={2} defaultValue={s.intro} className="input" /></div>
      <div className="sm:col-span-3"><p className="label">Tile image</p><ImageField name="tileImage" value={[s.image]} /></div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <span className={`text-xs font-semibold ${s.visible ? "text-emerald-700" : "text-amber-700"}`}>
          {s.count} products · {s.visible ? "visible in menu" : s.active ? `hidden until it has ${MIN_SUB_PRODUCTS}+ products` : "switched off"}
        </span>
        <button className="btn btn-outline ml-auto !min-h-11">Save</button>
      </div>
    </form>
  );
}

export default async function AdminCategories({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guard("content");
  const sp = await searchParams;
  const tree = await getCategoryTree(true);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Categories & mega-menu</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      <p className="text-sm text-slate-600">
        Menu order sets the order in the mega-menu (core five first). Sub-categories show in the menu once they have {MIN_SUB_PRODUCTS} or more live products. The margin floor blocks any price below cost + that percentage. Filters and spec templates per category are fixed in code.
      </p>
      {tree.map((c) => (
        <details key={c.slug} className="card p-4" open={tree.length < 3}>
          <summary className="cursor-pointer text-lg font-bold">{c.name} <span className="text-sm font-normal text-slate-500">· {c.subs.length} sub-categories · {c.count} products{c.active ? "" : " · hidden"}</span></summary>
          <div className="mt-3 grid gap-3">
            <CatForm c={c} />
            {c.subs.map((s) => <SubForm key={s.slug} parent={c.slug} s={s} />)}
            <form action={addSubcategory} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="parent" value={c.slug} />
              <div className="flex-1"><label className="label">Add a sub-category to {c.name}</label><input name="name" required placeholder="e.g. Projectors" className="input" /></div>
              <button className="btn btn-outline">Add</button>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
