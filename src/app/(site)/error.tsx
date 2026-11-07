"use client";

export default function SiteError({ reset }: { reset: () => void }) {
  return (
    <div className="container-x py-16 text-center">
      <h1 className="text-2xl font-extrabold text-brand-dark">Something went wrong</h1>
      <p className="mt-2 text-slate-700">Please try again. If it keeps happening, use the WhatsApp or Call buttons and we&apos;ll help you directly.</p>
      <button className="btn btn-primary mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
