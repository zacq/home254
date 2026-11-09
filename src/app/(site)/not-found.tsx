import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="container-x py-16 text-center">
      <h1 className="text-2xl font-extrabold text-brand-dark">We can&apos;t find that page</h1>
      <p className="mt-2 text-slate-700">The product may have sold out or moved. Try the search box above, or see today&apos;s deals.</p>
      <Link href="/deals" className="btn btn-primary mt-4">See today&apos;s deals</Link>
    </div>
  );
}
