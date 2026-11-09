import { desc } from "drizzle-orm";
import Link from "next/link";
import { Stars } from "@/components/Bits";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { guard } from "@/lib/guard";
import { deleteReview, moderateReview } from "../actions";

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const admin = await guard("content");
  const sp = await searchParams;
  const view = sp.view === "published" ? "published" : sp.view === "all" ? "all" : "queue";
  const [rows, ps] = await Promise.all([db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(300), db.select({ id: products.id, name: products.name }).from(products)]);
  const names = new Map(ps.map((p) => [p.id, p.name]));
  const list = rows.filter((r) => (view === "queue" ? !r.published : view === "published" ? r.published : true));
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Reviews</h1>
      <p className="text-sm text-slate-600">
        Reviews come only from customers whose order was delivered (they get a link in the delivery message). You can publish, hide or reply. Ratings and the buyer&apos;s words cannot be edited. Only verified, published reviews appear in the site pop-up.
      </p>
      <div className="flex gap-2">
        {[["queue", "Waiting for approval"], ["published", "Published"], ["all", "All"]].map(([k, l]) => (
          <Link key={k} href={`/admin/reviews?view=${k}`} className={`rounded-full px-3 py-2 text-sm font-semibold ${view === k ? "bg-brand text-white" : "bg-white"}`}>{l}</Link>
        ))}
      </div>
      {list.length === 0 && <p className="card p-4 text-slate-500">Nothing here.</p>}
      {list.map((r) => (
        <form key={r.id} action={moderateReview} className="card grid gap-2 p-3">
          <input type="hidden" name="id" value={r.id} />
          <p className="text-sm">
            <Stars n={r.rating} /> <b>{r.name}</b>{r.location ? `, ${r.location}` : ""} · {r.productId ? names.get(r.productId) ?? "Product" : "General"}
            {r.verified ? <span className="ml-1 text-xs font-bold text-emerald-700">✔ Verified buyer</span> : <span className="ml-1 text-xs font-bold text-amber-700">Not verified (older entry)</span>}
            <span className="ml-2 text-xs text-slate-400">{r.createdAt.toLocaleDateString("en-KE")}</span>
          </p>
          <blockquote className="rounded-lg bg-slate-50 p-2 text-sm">“{r.body}”</blockquote>
          <div><label className="label" htmlFor={`rp${r.id}`}>Store reply (optional, public)</label><textarea id={`rp${r.id}`} name="reply" rows={2} defaultValue={r.reply ?? ""} className="input" /></div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={r.published} className="h-5 w-5" /> Published</label>
            {admin.role === "owner" && <button formAction={deleteReview} className="text-xs font-semibold text-red-700 underline">Delete</button>}
            <button className="btn btn-brand ml-auto">Save</button>
          </div>
        </form>
      ))}
    </div>
  );
}
