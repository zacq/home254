import type { ReactNode } from "react";
import type { Review } from "@/db/schema";

export function TrustStrip({ items }: { items: Record<string, string>[] }) {
  return (
    <ul className="container-x grid grid-cols-2 gap-3 py-5 lg:grid-cols-4">
      {items.map((x) => (
        <li key={x.title} className="card flex items-start gap-3 p-3">
          <span aria-hidden className="text-2xl">{x.icon}</span>
          <span>
            <span className="block text-sm font-bold">{x.title}</span>
            <span className="block text-xs text-slate-600">{x.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="text-amber-500">
      {"★".repeat(n)}
      <span className="text-slate-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function ReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <figure key={r.id} className="card overflow-hidden">
          {r.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.imageUrl} alt={`Installed unit at ${r.name}'s home`} loading="lazy" className="aspect-video w-full object-cover" />
          )}
          <div className="p-4">
            <Stars n={r.rating} />
            <blockquote className="mt-1 text-sm leading-relaxed text-slate-700">“{r.body}”</blockquote>
            <figcaption className="mt-2 text-xs font-semibold text-slate-600">
              {r.name}
              {r.location ? `, ${r.location}` : ""}
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}

export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="bg-brand-light">
      <div className="container-x py-8">
        <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{title}</h1>
        {intro && <p className="mt-2 max-w-3xl text-slate-700">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ children, href, link }: { children: ReactNode; href?: string; link?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">{children}</h2>
      {href && (
        <a href={href} className="shrink-0 text-sm font-semibold text-brand underline">{link ?? "View all"}</a>
      )}
    </div>
  );
}
