import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { guard } from "@/lib/guard";

export default async function AuditPage() {
  await guard("owner");
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Audit log</h1>
      <ul className="card divide-y text-sm">
        {rows.length === 0 && <li className="p-3 text-slate-500">No changes logged yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="p-3">
            <b>{r.actor}</b> {r.action} {r.entity}{r.entityId ? ` #${r.entityId}` : ""} <span className="text-slate-600">{r.detail}</span>
            <span className="block text-xs text-slate-400">{r.createdAt.toLocaleString("en-KE")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
