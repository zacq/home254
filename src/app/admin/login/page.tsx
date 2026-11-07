"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="card mx-auto mt-10 grid max-w-sm gap-3 p-6">
      <h1 className="text-xl font-extrabold text-brand-dark">Admin login</h1>
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" required autoComplete="username" autoCapitalize="none" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="code">2FA code (if turned on)</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" className="input" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      <button className="btn btn-brand" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
