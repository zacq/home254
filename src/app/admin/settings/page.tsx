import { guard } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../actions";

const FIELDS: [string, string, string?][] = [
  ["storeName", "Store name"],
  ["tagline", "Tagline (under the logo)"],
  ["whatsapp", "WhatsApp number (international, no +)", "e.g. 254712345678"],
  ["phoneDisplay", "Phone (display)"],
  ["phoneTel", "Phone (tel link)", "e.g. +254712345678"],
  ["email", "Email"],
  ["tillNumber", "M-Pesa Till number"],
  ["paymentLabel", "Payment label"],
  ["showroomAddress", "Showroom address"],
  ["openingHours", "Opening hours"],
  ["mapQuery", "Google Maps search text"],
  ["podCap", "Pay on Delivery order cap (KSh)"],
  ["depositThreshold", "Deposit applies from order total (KSh)"],
  ["depositPct", "Deposit percentage"],
  ["warrantyPct", "Extended warranty price (% of item)"],
  ["pedestalPrice", "Stand / pedestal price (KSh)", "Set to 0 if not stocked. It then stays hidden in the cart."],
  ["financingRates", "Approved instalment rates", "Only fill in with rates the financing partner has approved, as months:total markup %. E.g. 6:12, 12:24. Leave blank to show 'plans available, ask us'."],
  ["dealerStatement", "Dealer status statement"],
  ["instagram", "Instagram URL"],
  ["tiktok", "TikTok URL"],
  ["facebook", "Facebook URL"],
  ["youtube", "YouTube URL"],
];

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await guard("owner");
  const [sp, s] = [await searchParams, await getSettings()];
  return (
    <form action={saveSettings} className="card mx-auto grid max-w-2xl gap-3 p-4">
      <h1 className="text-2xl font-extrabold text-brand-dark">Store settings</h1>
      {sp.saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-900">✓ Saved</p>}
      <p className="text-sm text-slate-600">The promo strip, hero slides and store branches are under Content. Rewards rules are under Rewards.</p>
      {FIELDS.map(([k, l, h]) => (
        <div key={k}>
          <label className="label" htmlFor={k}>{l}</label>
          <input id={k} name={k} defaultValue={s[k as keyof typeof s]} className="input" />
          {h && <p className="text-xs text-slate-500">{h}</p>}
        </div>
      ))}
      <button className="btn btn-primary">Save settings</button>
    </form>
  );
}
