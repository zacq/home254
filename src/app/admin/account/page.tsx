import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { guard } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { totpUri } from "@/lib/totp";
import { changeMyPassword, confirmTotp, disableTotp, startTotp } from "../actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const me = await guard();
  const [sp, s, [u]] = await Promise.all([searchParams, getSettings(), db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1)]);
  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">My account</h1>
      <p className="text-sm text-slate-600">{me.name} · {me.username} · {me.role}</p>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">{sp.error}</p>}

      <form action={changeMyPassword} className="card grid gap-3 p-4">
        <h2 className="font-bold">Change password</h2>
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="input" />
          <p className="mt-0.5 text-xs text-slate-500">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <button className="btn btn-brand w-fit">Change password</button>
      </form>

      <section className="card grid gap-3 p-4">
        <h2 className="font-bold">Two-factor login (2FA)</h2>
        {u.totpEnabled ? (
          <form action={disableTotp} className="grid gap-3">
            <p className="text-sm font-semibold text-emerald-800">2FA is on.</p>
            <div>
              <label className="label" htmlFor="code">Enter a current code to turn it off</label>
              <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required className="input" />
            </div>
            <button className="btn btn-outline w-fit">Turn off 2FA</button>
          </form>
        ) : u.totpSecret ? (
          <form action={confirmTotp} className="grid gap-3">
            <p className="text-sm text-slate-700">In Google Authenticator or a similar app, add an account with this setup key, or tap the link on this phone:</p>
            <p className="break-all rounded-lg bg-slate-100 p-3 font-mono text-sm">{u.totpSecret}</p>
            <a className="text-sm font-semibold underline" href={totpUri(u.totpSecret, u.username, s.storeName)}>Open in authenticator app</a>
            <div>
              <label className="label" htmlFor="code">Enter the 6-digit code it shows</label>
              <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required className="input" />
            </div>
            <button className="btn btn-brand w-fit">Turn on 2FA</button>
          </form>
        ) : (
          <form action={startTotp} className="grid gap-3">
            <p className="text-sm text-slate-700">Adds a 6-digit code from your phone to every login.</p>
            <button className="btn btn-brand w-fit">Set up 2FA</button>
          </form>
        )}
      </section>
    </div>
  );
}
