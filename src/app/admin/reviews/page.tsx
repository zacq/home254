import { desc } from "drizzle-orm";
import { ImageField } from "@/components/admin/ImageField";
import { db } from "@/db";
import { reviews, type Review } from "@/db/schema";
import { guard } from "@/lib/guard";
import { allProducts } from "@/lib/queries";
import { deleteReview, saveReview } from "../actions";

function ReviewForm({ r, products }: { r?: Review; products: { id: number; name: string }[] }) {
  return (
    <form action={saveReview} className="card grid gap-2 p-3 sm:grid-cols-2">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div><label className="label">Customer name</label><input name="name" required defaultValue={r?.name} className="input" /></div>
      <div><label className="label">Location</label><input name="location" defaultValue={r?.location ?? ""} className="input" /></div>
      <div><label className="label">Rating (1–5)</label><input name="rating" type="number" min={1} max={5} defaultValue={r?.rating ?? 5} className="input" /></div>
      <div>
        <label className="label">Product</label>
        <select name="productId" defaultValue={r?.productId ?? ""} className="input"><option value="">General</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="sm:col-span-2"><label className="label">Review</label><textarea name="body" required rows={2} defaultValue={r?.body} className="input" /></div>
      <div className="sm:col-span-2"><p className="label">Installed-unit photo</p><ImageField name="imageUrl" value={r?.imageUrl ? [r.imageUrl] : []} /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={r ? r.published : true} className="h-5 w-5" /> Published</label>
      <div className="flex justify-end gap-2">
        {r && <button formAction={deleteReview} className="btn btn-outline !border-red-600 !text-red-700">Delete</button>}
        <button className="btn btn-brand">{r ? "Save" : "Add review"}</button>
      </div>
    </form>
  );
}

export default async function AdminReviews() {
  await guard("content");
  const [rows, ps] = await Promise.all([db.select().from(reviews).orderBy(desc(reviews.createdAt)), allProducts()]);
  const opts = ps.map((p) => ({ id: p.id, name: p.name }));
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Reviews</h1>
      <p className="text-sm text-slate-600">Only add genuine customer reviews. Published reviews show on product pages, home and the showroom page.</p>
      <h2 className="font-bold">Add a review</h2>
      <ReviewForm products={opts} />
      {rows.length > 0 && <h2 className="mt-3 font-bold">Existing</h2>}
      {rows.map((r) => <ReviewForm key={r.id} r={r} products={opts} />)}
    </div>
  );
}
