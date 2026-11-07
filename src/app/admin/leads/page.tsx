import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { guard } from "@/lib/guard";
import { waLink } from "@/lib/settings";
import { deleteLead, updateLead } from "../actions";

const TYPE_LABEL: Record<string, string> = { booking: "Showroom booking", financing: "Instalment enquiry", contact: "Enquiry", notify: "Back-in-stock", quiz: "Quiz result" };

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const admin = await guard("sales");
  const { status, type } = await searchParams;
  let rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(300);
  if (status) rows = rows.filter((r) => r.status === status);
  if (type) rows = rows.filter((r) => r.type === type);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Leads inbox</h1>
      <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <Link href="/admin/leads" className="shrink-0 rounded-full bg-white px-3 py-2">All</Link>
        {["new", "contacted", "won", "lost"].map((s) => <Link key={s} href={`/admin/leads?status=${s}`} className={`shrink-0 rounded-full px-3 py-2 capitalize ${status === s ? "bg-brand text-white" : "bg-white"}`}>{s}</Link>)}
        {Object.entries(TYPE_LABEL).map(([k, v]) => <Link key={k} href={`/admin/leads?type=${k}`} className={`shrink-0 rounded-full px-3 py-2 ${type === k ? "bg-brand text-white" : "bg-white"}`}>{v}</Link>)}
      </div>
      <p className="text-xs text-slate-500">WhatsApp and call clicks are counted on the dashboard (count only).</p>
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="card p-4 text-slate-500">No leads.</li>}
        {rows.map((l) => (
          <li key={l.id} className="card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{TYPE_LABEL[l.type] ?? l.type}</span>
              <b>{l.name}</b>
              <a className="underline" href={`tel:+${l.phone}`}>+{l.phone}</a>
              {l.phone && <a className="font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(l.phone, `Hi ${l.name?.split(" ")[0] ?? ""}, thanks for your enquiry${l.productName ? ` about the ${l.productName}` : ""}.`)}>WhatsApp</a>}
              <span className="ml-auto text-xs text-slate-400">{l.createdAt.toLocaleString("en-KE")}</span>
            </div>
            <p className="mt-1 text-slate-600">
              {l.productName ? `Product: ${l.productName} · ` : ""}Source: {l.sourcePage ?? "n/a"}
              {Object.entries(l.details).map(([k, v]) => ` · ${k}: ${v}`)}
            </p>
            <form action={updateLead} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={l.id} />
              <div>
                <label className="label" htmlFor={`s${l.id}`}>Status</label>
                <select id={`s${l.id}`} name="status" defaultValue={l.status} className="input !w-auto">
                  {["new", "contacted", "won", "lost"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`a${l.id}`}>Assigned to</label>
                <input id={`a${l.id}`} name="assignee" defaultValue={l.assignee ?? ""} className="input !w-40" placeholder="Staff name" />
              </div>
              <button className="btn btn-brand">Save</button>
              {admin.role === "owner" && <button formAction={deleteLead} className="ml-auto text-xs font-semibold text-red-700 underline">Delete (data request)</button>}
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
