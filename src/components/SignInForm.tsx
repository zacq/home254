"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

// Phone + one-time code sign-in that also joins Rewards (PRD FR-28, CK-4).
export function SignInForm({ next, bonus, rewardsName }: { next: string; bonus: number; rewardsName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function sendCode(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await post("/api/account/code", { phone, website: e ? new FormData(e.currentTarget).get("website") : "" });
      if (!data.ok) throw new Error(data.error);
      setDevCode(data.devCode ?? "");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not send the code. Please try again.");
    }
    setBusy(false);
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const data = await post("/api/account/verify", { phone, code: fd.get("code"), name: fd.get("name"), email: fd.get("email"), consent: fd.get("consent") === "on" });
      if (!data.ok) throw new Error(data.error);
      if (data.joined) track("rewards_signup", { value: data.bonus });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not sign you in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="card mx-auto grid max-w-md gap-4 p-5">
      {step === "phone" ? (
        <form onSubmit={sendCode} className="grid gap-3" noValidate>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div>
            <label className="label" htmlFor="phone">Phone number (07xx / 01xx)</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="input" />
          </div>
          <p className="text-xs text-slate-600">We&apos;ll text you a 6-digit code. New here? You join {rewardsName} free and get {bonus} welcome points.</p>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send my code"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="grid gap-3" noValidate>
          <p className="text-sm">We sent a code to <b>{phone}</b>. <button type="button" className="font-semibold text-brand underline" onClick={() => setStep("phone")}>Change</button></p>
          {devCode && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Development mode: your code is <b>{devCode}</b>.</p>}
          <div>
            <label className="label" htmlFor="code">6-digit code</label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required className="input text-center text-2xl tracking-[0.5em]" />
          </div>
          <div>
            <label className="label" htmlFor="name">Your name (for new members)</label>
            <input id="name" name="name" autoComplete="name" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email (optional)</label>
            <input id="email" name="email" type="email" autoComplete="email" className="input" />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0" />
            <span>Send me member deals, points and expiry reminders by SMS or WhatsApp. I can opt out any time.</span>
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
          <button type="button" className="text-sm font-semibold text-brand underline" disabled={busy} onClick={() => sendCode()}>Send a new code</button>
        </form>
      )}
      <p className="text-xs text-slate-500">By continuing you accept the <Link href="/rewards#terms" className="underline">Rewards terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</p>
    </div>
  );
}
