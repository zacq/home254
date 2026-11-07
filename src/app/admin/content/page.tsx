import Link from "next/link";
import { BLOCKS, type Block } from "@/lib/content-schema";
import { guard } from "@/lib/guard";

export default async function AdminContent() {
  await guard("content");
  const entries = Object.entries(BLOCKS) as [string, Block][];
  const groups = [...new Set(entries.map(([, b]) => b.group))];
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold text-brand-dark">Content</h1>
      <p className="text-sm text-slate-600">Edit the words and images on the site. Products, reviews and delivery zones have their own tabs.</p>
      {groups.map((g) => (
        <section key={g}>
          <h2 className="mb-2 font-bold">{g}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {entries.filter(([, b]) => b.group === g).map(([k, b]) => (
              <li key={k}>
                <Link href={`/admin/content/${k}`} className="card block h-full p-3">
                  <span className="block font-bold underline">{b.title}</span>
                  {b.description && <span className="block text-xs text-slate-600">{b.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
