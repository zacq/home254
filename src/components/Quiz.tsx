"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { ksh, waLink } from "@/lib/format";

const QUESTIONS = [
  { key: "household", q: "How many people live in your home?", options: [["1-2", "1–2 people"], ["3-4", "3–4 people"], ["5+", "5 or more"]] },
  { key: "space", q: "How much space do you have?", options: [["small", "Small apartment / no line-drying space"], ["medium", "Standard laundry area"], ["large", "Plenty of room"]] },
  { key: "dry", q: "Do you need drying too?", options: [["yes", "Yes — wash and dry"], ["no", "No, washing only"]] },
  { key: "budget", q: "What's your budget?", options: [["low", "Up to KSh 45,000"], ["mid", "Up to KSh 100,000"], ["high", "Up to KSh 130,000"], ["any", "Show me the best"]] },
  { key: "priority", q: "What matters most?", options: [["hygiene", "Hygiene (steam wash)"], ["running", "Low running cost"], ["quiet", "Quiet & long-lasting"], ["price", "Lowest price"]] },
] as const;

type Result = { id: number; name: string; path: string; modelNumber: string; shortBenefit: string; price: number; image: string | null };

export function Quiz({ whatsapp }: { whatsapp: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function pick(key: string, val: string) {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) return setStep(step + 1);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const data = await res.json();
      setResults(data.results ?? []);
      track("quiz_complete", {});
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const summary = (results ?? []).map((r) => `${r.name} (${r.modelNumber}) ${ksh(r.price)}`).join("; ");

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quiz",
        name: fd.get("name"),
        phone: fd.get("phone"),
        website: fd.get("website"),
        consent: fd.get("consent") === "on",
        sourcePage: "/which-machine",
        productName: results?.[0]?.name,
        productId: results?.[0]?.id,
        answers: `${JSON.stringify(answers)} → ${summary}`,
      }),
    });
    const data = await res.json();
    if (!data.ok) return setErr(data.error || "Please check your details.");
    setSent(waLink(whatsapp, `Hi, please send me my machine recommendations. My quiz result: ${summary}`));
  }

  if (loading) return <p className="card p-6 text-center font-semibold" role="status">Finding your best match…</p>;

  if (results) {
    return (
      <div className="grid gap-4">
        <h2 className="text-xl font-extrabold text-brand-dark">{results.length ? "Our recommendations for you" : "We'd like to help you personally"}</h2>
        {results.map((r, n) => (
          <div key={r.id} className="card flex gap-3 p-3">
            {r.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />
            )}
            <div className="min-w-0 flex-1">
              {n === 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">Best match</span>}
              <p className="font-bold leading-tight">{r.name}</p>
              <p className="text-sm text-slate-600">{r.shortBenefit}</p>
              <p className="mt-1 font-extrabold text-brand-dark">{ksh(r.price)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link className="btn btn-primary !min-h-11 !text-sm" href={r.path}>View & buy</Link>
                <a className="btn btn-wa !text-sm" target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { productId: r.id })} href={waLink(whatsapp, `Hi, I'm interested in the ${r.name} (${r.modelNumber}) at ${ksh(r.price)}. Is it available for delivery to [area]?`)}>💬 WhatsApp</a>
              </div>
            </div>
          </div>
        ))}
        <div className="card p-4">
          <h3 className="font-bold">Send my result on WhatsApp</h3>
          {sent ? (
            <a href={sent} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-2">✓ Saved — open WhatsApp to chat with us</a>
          ) : (
            <form onSubmit={send} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              <label className="sr-only" htmlFor="qn">Name</label>
              <input id="qn" name="name" placeholder="Your name" required className="input" />
              <label className="sr-only" htmlFor="qp">Phone</label>
              <input id="qp" name="phone" type="tel" inputMode="tel" placeholder="07xx xxx xxx" required className="input" />
              <button className="btn btn-brand">Send</button>
              <label className="flex items-start gap-3 text-sm sm:col-span-3">
                <input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0" />
                <span>I agree to be contacted about my result. My details are handled under the privacy policy.</span>
              </label>
              {err &&<p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-3">{err}</p>}
            </form>
          )}
        </div>
        <button className="text-sm font-semibold text-brand underline" onClick={() => { setResults(null); setStep(0); setAnswers({}); setSent(null); }}>Start again</button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="card p-5">
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1}>
        <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <p className="text-xs font-semibold text-slate-500">Question {step + 1} of {QUESTIONS.length}</p>
      <h2 className="mt-1 text-xl font-extrabold text-brand-dark">{q.q}</h2>
      <div className="mt-4 grid gap-2">
        {(q.options as readonly (readonly [string, string])[]).map(([v, l]) => (
          <button key={v} className="btn btn-outline !justify-start !py-3 text-left" onClick={() => pick(q.key, v)}>{l}</button>
        ))}
      </div>
      {step > 0 && <button className="mt-4 text-sm font-semibold text-brand underline" onClick={() => setStep(step - 1)}>← Back</button>}
    </div>
  );
}
