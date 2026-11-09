import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/Bits";
import { RewardsStatus } from "@/components/RewardsStatus";
import { db } from "@/db";
import { customers, orders, wishlistItems } from "@/db/schema";
import { destroyCustomerSession, getCustomer } from "@/lib/customer-auth";
import { ksh } from "@/lib/format";
import { statusLabel } from "@/lib/orders";

export const metadata = { title: "My account", robots: { index: false } };

async function signOut() {
  "use server";
  await destroyCustomerSession();
  redirect("/");
}

async function saveProfile(fd: FormData) {
  "use server";
  const c = await getCustomer();
  if (!c) redirect("/account/sign-in");
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().slice(0, 200);
  const birthday = String(fd.get("birthday") ?? "").trim().slice(0, 10);
  await db
    .update(customers)
    .set({ name: name || null, email: email || null, birthday: /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? birthday : null, marketingConsent: fd.get("consent") === "on" })
    .where(eq(customers.id, c.id));
  revalidatePath("/account");
  redirect("/account?saved=1");
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const c = await getCustomer();
  if (!c) redirect("/account/sign-in?next=/account");
  const sp = await searchParams;
  const [myOrders, wish] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, c.id)).orderBy(desc(orders.createdAt)).limit(30),
    db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.customerId, c.id)),
  ]);
  return (
    <>
      <PageHeader title={`Hello${c.name ? `, ${c.name.split(" ")[0]}` : ""}`} intro={`Signed in as +${c.phone}`}>
        <form action={signOut} className="mt-3"><button className="btn btn-outline">Sign out</button></form>
      </PageHeader>
      <div className="container-x grid gap-8 py-6">
        {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
        <section aria-labelledby="pts-h">
          <h2 id="pts-h" className="mb-3 text-xl font-extrabold text-brand-dark">Points & tier</h2>
          <RewardsStatus customer={c} />
        </section>
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="mb-3 text-xl font-extrabold text-brand-dark">My orders</h2>
          {myOrders.length === 0 ? (
            <p className="card p-4 text-sm text-slate-600">No orders yet. <Link href="/deals" className="font-semibold text-brand underline">See today&apos;s deals</Link></p>
          ) : (
            <ul className="grid gap-2">
              {myOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.token}`} className="card flex flex-wrap items-center justify-between gap-2 p-3">
                    <span><b>{o.orderNumber}</b> · {o.createdAt.toLocaleDateString("en-KE")}</span>
                    <span className="text-sm">{ksh(o.total)} · <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{statusLabel(o.status)}</span>{o.pointsEarned ? ` · +${o.pointsEarned} pts` : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4">
            <h2 className="text-lg font-bold">Wishlist</h2>
            <p className="mt-1 text-sm text-slate-600">{wish.length} saved product{wish.length === 1 ? "" : "s"}.</p>
            <Link href="/wishlist" className="btn btn-outline mt-3">Open my wishlist</Link>
          </div>
          <form action={saveProfile} className="card grid gap-3 p-4">
            <h2 className="text-lg font-bold">Profile & alerts</h2>
            <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" defaultValue={c.name ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={c.email ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="birthday">Birthday (for birthday points)</label><input id="birthday" name="birthday" type="date" defaultValue={c.birthday ?? ""} className="input" /></div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent" defaultChecked={c.marketingConsent} className="mt-1 h-5 w-5 shrink-0" />
              <span>Send me member deals, points and expiry reminders by SMS or WhatsApp.</span>
            </label>
            <button className="btn btn-brand w-fit">Save</button>
          </form>
        </section>
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Your data</h2>
          <p className="mt-1 text-slate-600">Download everything we hold about you, or ask us to correct or delete it (Kenya Data Protection Act, 2019).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
            <a href="/api/account/export" className="btn btn-outline">⬇ Download my data</a>
            <Link href="/contact" className="btn btn-outline">Request correction or deletion</Link>
          </div>
        </section>
      </div>
    </>
  );
}
