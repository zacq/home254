import { and, desc, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { hoursAgo } from "@/lib/format";
import { guard } from "@/lib/guard";
import { waLink } from "@/lib/settings";

const VIEWS = [
  ["customer", "To customers"],
  ["sms", "Sign-in codes (SMS)"],
  ["admin", "Staff alerts"],
] as const;

// Outbox for order, points and lead messages. Until SMS/WhatsApp APIs are connected, staff send them by tapping Send.
export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await guard("sales", "fulfilment");
  const sp = await searchParams;
  const view = VIEWS.some(([k]) => k === sp.view) ? sp.view! : "customer";
  const where =
    view === "sms"
      ? and(eq(notifications.channel, "sms"), gte(notifications.createdAt, hoursAgo(1)))
      : view === "admin"
        ? eq(notifications.audience, "admin")
        : and(eq(notifications.audience, "customer"), eq(notifications.channel, "whatsapp"));
  const rows = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(150);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Messages</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map(([k, l]) => <Link key={k} href={`/admin/messages?view=${k}`} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${view === k ? "bg-brand text-white" : "bg-white"}`}>{l}</Link>)}
      </div>
      {view === "sms" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          No SMS provider is connected yet, so sign-in codes wait here for 1 hour (each code works for 10 minutes). When a customer asks for their code, check their phone number and send it by WhatsApp. Never read a code out to someone calling about a different number.
        </p>
      )}
      <ul className="grid gap-2">
        {rows.length === 0 && <li className="card p-4 text-slate-500">Nothing here.</li>}
        {rows.map((n) => (
          <li key={n.id} className="card p-3 text-sm">
            <p className="font-semibold">{n.subject} {n.recipient && <span className="font-normal text-slate-500">· +{n.recipient}</span>}</p>
            <p className="text-slate-600">{n.message}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs">
              {n.recipient && <a className="font-bold text-wa underline" target="_blank" rel="noopener noreferrer" href={waLink(n.recipient, n.message)}>Send on WhatsApp</a>}
              {n.refType === "order" && <Link className="underline" href={`/admin/orders/${n.refId}`}>Open order</Link>}
              {n.refType === "lead" && <Link className="underline" href="/admin/leads">Open leads</Link>}
              <span className="text-slate-400">{n.createdAt.toLocaleString("en-KE")}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
