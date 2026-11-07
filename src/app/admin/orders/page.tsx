import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ksh } from "@/lib/format";
import { guard } from "@/lib/guard";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await guard("sales");
  const { status } = await searchParams;
  const rows = await (status ? db.select().from(orders).where(eq(orders.status, status)) : db.select().from(orders)).orderBy(desc(orders.createdAt)).limit(200);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark">Orders</h1>
        <Link href="/admin/orders/new" className="btn btn-primary ml-auto">+ Create order</Link>
        <a href="/api/admin/export/orders" className="btn btn-outline">Export CSV</a>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${!status ? "bg-brand text-white" : "bg-white"}`}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s.key} href={`/admin/orders?status=${s.key}`} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${status === s.key ? "bg-brand text-white" : "bg-white"}`}>{s.label}</Link>
        ))}
      </div>
      <ul className="grid gap-2">
        {rows.length === 0 && <li className="card p-4 text-slate-500">No orders.</li>}
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-3">
              <span>
                <b>{o.orderNumber}</b> · {o.customerName}
                <span className="block text-xs text-slate-500">{o.phone} · {o.zoneName} · {o.paymentMethod === "mpesa" ? "M-Pesa" : "POD"} · {o.source} · {o.createdAt.toLocaleString("en-KE")}</span>
              </span>
              <span className="text-right">
                <b>{ksh(o.total)}</b>
                <span className="block rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">{statusLabel(o.status)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
