"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

type Field = "email" | "date" | "slot" | "plan" | "employment" | "message" | "product";

export function LeadForm({
  type,
  fields,
  productId,
  productName,
  productOptions,
  submitLabel = "Send",
  successMessage = "Thanks! We'll be in touch shortly.",
  event,
  consentText = "I agree to be contacted about this enquiry. My details are handled under our privacy policy.",
}: {
  type: "booking" | "financing" | "contact" | "notify";
  fields: Field[];
  productId?: number;
  productName?: string;
  productOptions?: { id: number; name: string }[];
  submitLabel?: string;
  successMessage?: string;
  event?: "booking_submit" | "financing_submit";
  consentText?: string;
}) {
  const path = usePathname();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const has = (f: Field) => fields.includes(f);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    body.consent = fd.get("consent") === "on";
    body.type = type;
    body.sourcePage = path;
    if (productId) body.productId = productId;
    if (has("product")) {
      const opt = productOptions?.find((o) => String(o.id) === String(body.productSel));
      if (opt) {
        body.productId = opt.id;
        body.productName = opt.name;
      }
    } else if (productName) body.productName = productName;
    setState("sending");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong");
      if (event) track(event, { productId: (body.productId as number) ?? undefined });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try WhatsApp instead.");
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div role="status" className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">
        ✓ {successMessage}
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${type}-name`}>Full name</label>
          <input id={`${type}-name`} name="name" required autoComplete="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`${type}-phone`}>Phone (07xx / 01xx)</label>
          <input id={`${type}-phone`} name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className="input" />
        </div>
      </div>
      {has("email") && (
        <div>
          <label className="label" htmlFor={`${type}-email`}>Email (optional)</label>
          <input id={`${type}-email`} name="email" type="email" autoComplete="email" className="input" />
        </div>
      )}
      {has("product") && (
        <div>
          <label className="label" htmlFor={`${type}-prod`}>Product of interest</label>
          <select id={`${type}-prod`} name="productSel" className="input" defaultValue="">
            <option value="">Not sure yet</option>
            {productOptions?.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}
      {(has("date") || has("slot")) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {has("date") && (
            <div>
              <label className="label" htmlFor={`${type}-date`}>Preferred date</label>
              <input id={`${type}-date`} name="date" type="date" required className="input" min={new Date().toISOString().slice(0, 10)} />
            </div>
          )}
          {has("slot") && (
            <div>
              <label className="label" htmlFor={`${type}-slot`}>Time slot</label>
              <select id={`${type}-slot`} name="slot" className="input" defaultValue="morning">
                <option value="morning">Morning (9–12)</option>
                <option value="afternoon">Afternoon (12–4)</option>
                <option value="evening">Evening (4–6)</option>
              </select>
            </div>
          )}
        </div>
      )}
      {(has("plan") || has("employment")) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {has("plan") && (
            <div>
              <label className="label" htmlFor={`${type}-plan`}>Preferred plan length</label>
              <select id={`${type}-plan`} name="plan" className="input" defaultValue="6 months">
                {["3 months", "6 months", "9 months", "12 months", "18 months"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
          {has("employment") && (
            <div>
              <label className="label" htmlFor={`${type}-emp`}>Employment type</label>
              <select id={`${type}-emp`} name="employment" className="input" defaultValue="Employed">
                {["Employed", "Self-employed / business owner", "Other"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      {has("message") && (
        <div>
          <label className="label" htmlFor={`${type}-msg`}>Message</label>
          <textarea id={`${type}-msg`} name="message" rows={3} className="input" />
        </div>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0" />
        <span>{consentText}</span>
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
      <button className="btn btn-brand" disabled={state === "sending"}>{state === "sending" ? "Sending…" : submitLabel}</button>
    </form>
  );
}
