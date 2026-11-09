import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/Bits";
import { ProductCard } from "@/components/ProductCard";
import { WishlistUrlSync } from "@/components/Wishlist";
import { getCustomer } from "@/lib/customer-auth";
import { productsByIds } from "@/lib/queries";

export const metadata = { title: "My wishlist", robots: { index: false } };

export default async function WishlistPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const wanted = [...new Set(ids.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 100);
  const [list, member] = await Promise.all([productsByIds(wanted), getCustomer()]);
  return (
    <>
      <Suspense fallback={null}><WishlistUrlSync /></Suspense>
      <PageHeader title="My wishlist" intro={member ? "Saved to your account." : "Saved on this device. Sign in to keep it on your account."} />
      <div className="container-x py-6">
        {list.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-bold">Nothing saved yet.</p>
            <p className="mt-1 text-sm text-slate-600">Tap ♡ on any product to save it here.</p>
            <Link href="/deals" className="btn btn-primary mt-3">See today&apos;s deals</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
