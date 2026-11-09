import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { guard } from "@/lib/guard";
import { LEAD_LABEL } from "@/lib/leads";
import { getRewardsConfig } from "@/lib/rewards";
import { waLink } from "@/lib/settings";
import { approveWarranty, deleteLead, issuePriceCode, updateLead } from "../actions";

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; saved?: string; error?: string }> }) {
  const admin = await guard("sales", "pricing");
  const { status, type, saved, error } = await searchParams;
  const cfg = await getRewardsConfig();
  let rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(300);
  if (status) rows = rows.filter((r) => r.status === status);
  if (type) rows = rows.filter((r) => r.type === type);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Leads inbox</h1>
      {saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Done. The customer message is in Messages, ready to send.</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{error}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <Link href="/admin/leads" className="shrink-0 rounded-full bg-white px-3 py-2">All</Link>
        {["new", "contacted", "won", "lost"].map((s) => <Link key={s} href={`/admin/leads?status=${s}`} className={`shrink-0 rounded-full px-3 py-2 capitalize ${status === s ? "bg-brand text-white" : "bg-white"}`}>{s}</Link>)}
        {Object.entries(LEAD_LABEL).map(([k, v]) => <Link key={k} href={`/admin/leads?type=${k}`} className={`shrink-0 rounded-full px-3 py-2 ${type === k ? "bg-brand text-white" : "bg-white"}`}>{v}</Link>)}
      </div>
      <p className="text-xs text-slate-500">Best Price Promise requests should be answered within 24 hours. WhatsApp and call clicks are counted on the dashboard.</p>
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="card p-4 text-slate-500">No leads.</li>}
        {rows.map((l) => (
          <li key={l.id} className="card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{LEAD_LABEL[l.type] ?? l.type}</span>
              <b>{l.name}</b>
              <a className="underline" href={`tel:+${l.phone}`}>+{l.phone}</a>
              {l.phone && <a className="font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(l.phone, `Hi ${l.name?.split(" ")[0] ?? ""}, thanks for your request${l.productName ? ` about the ${l.productName}` : ""}.`)}>WhatsApp</a>}
              <span className="ml-auto text-xs text-slate-400">{l.createdAt.toLocaleString("en-KE")}</span>
            </div>
            <p className="mt-1 text-slate-600">
              {l.productName ? `Product: ${l.productName} · ` : ""}Source: {l.sourcePage ?? "n/a"}
              {Object.entries(l.details).map(([k, v]) => ` · ${k}: ${v}`)}
            </p>
            {l.type === "price_match" && !l.details.code && l.status !== "lost" && (
              <form action={issuePriceCode} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-brand-light p-2">
                <input type="hidden" name="id" value={l.id} />
                <div>
                  <label className="label" htmlFor={`pm${l.id}`}>Approve at price (KSh)</label>
                  <input id={`pm${l.id}`} name="price" type="number" required defaultValue={l.details.advertisedPrice ?? ""} className="input !w-40" />
                </div>
                <button className="btn btn-brand">Issue one-time price code</button>
                <span className="text-xs text-slate-600">Check: same model, new, in stock, authorised Kenyan retailer, not clearance or marketplace. Refused if below the margin floor.</span>
              </form>
            )}
            {l.type === "warranty" && !l.details.awarded && (
              <form action={approveWarranty} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-brand-light p-2">
                <input type="hidden" name="id" value={l.id} />
                <button className="btn btn-brand">Approve & award {cfg.warrantyBonus} points</button>
                <span className="text-xs text-slate-600">Check the order number, or the serial number and receipt photo.</span>
              </form>
            )}
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
              <button className="btn btn-outline">Save</button>
              {admin.role === "owner" && <button formAction={deleteLead} className="ml-auto text-xs font-semibold text-red-700 underline">Delete (data request)</button>}
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
