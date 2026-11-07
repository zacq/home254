import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x py-20 text-center">
      <h1 className="text-2xl font-extrabold text-brand-dark">Page not found</h1>
      <p className="mt-2 text-slate-700">That page has moved or no longer exists.</p>
      <Link href="/" className="btn btn-primary mt-4">Go to the homepage</Link>
    </main>
  );
}
