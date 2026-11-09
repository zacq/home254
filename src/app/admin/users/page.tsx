import { asc } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, type AdminUser } from "@/db/schema";
import { MIN_PASSWORD_LENGTH, ROLES } from "@/lib/auth";
import { guard } from "@/lib/guard";
import { resetUserTotp, saveUser } from "../actions";

const ROLE_NOTE: Record<string, string> = {
  owner: "Everything, incl. Rewards, settings and users",
  pricing: "Pricing engine, deals, promo codes, price matches",
  sales: "Orders, leads, customers, messages",
  content: "Products, categories, content, reviews, delivery",
  fulfilment: "Orders (status, delivery slot, driver) and messages",
};

function UserForm({ u, isSelf }: { u?: AdminUser; isSelf?: boolean }) {
  return (
    <div className="card p-3">
      <form action={saveUser} className="grid gap-2 sm:grid-cols-2">
        {u && <input type="hidden" name="id" value={u.id} />}
        <div>
          <label className="label" htmlFor={`un-${u?.id ?? "new"}`}>Username</label>
          <input id={`un-${u?.id ?? "new"}`} name="username" required disabled={!!u} defaultValue={u?.username} autoComplete="off" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`nm-${u?.id ?? "new"}`}>Name</label>
          <input id={`nm-${u?.id ?? "new"}`} name="name" required defaultValue={u?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`ro-${u?.id ?? "new"}`}>Role</label>
          <select id={`ro-${u?.id ?? "new"}`} name="role" defaultValue={u?.role ?? "sales"} disabled={isSelf} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{r}: {ROLE_NOTE[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`pw-${u?.id ?? "new"}`}>{u ? "New password (optional)" : "Password"}</label>
          <input id={`pw-${u?.id ?? "new"}`} name="password" type="password" minLength={MIN_PASSWORD_LENGTH} required={!u} autoComplete="new-password" className="input" />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={u ? u.active : true} disabled={isSelf} className="h-5 w-5" /> Active
          {u && <span className="ml-2 text-xs text-slate-500">2FA {u.totpEnabled ? "on" : "off"}</span>}
        </label>
        <div className="flex justify-end">
          <button className="btn btn-brand">{u ? "Save" : "Add user"}</button>
        </div>
      </form>
      {u?.totpEnabled && (
        <form action={resetUserTotp} className="mt-1">
          <input type="hidden" name="id" value={u.id} />
          <button className="text-xs font-semibold text-red-700 underline">Reset 2FA (lost phone)</button>
        </form>
      )}
    </div>
  );
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const me = await guard("owner");
  const sp = await searchParams;
  const rows = await db.select().from(adminUsers).orderBy(asc(adminUsers.id));
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold text-brand-dark">Users & roles</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}
      {rows.map((u) => <UserForm key={u.id} u={u} isSelf={u.id === me.id} />)}
      <h2 className="mt-3 font-bold">Add a user</h2>
      <UserForm />
    </div>
  );
}
