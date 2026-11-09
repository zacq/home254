import { db } from "@/db";
import { leads, notifications } from "@/db/schema";
import { normalisePhone } from "@/lib/format";
import { LEAD_LABEL, LEAD_TYPES } from "@/lib/leads";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const TYPES = LEAD_TYPES;
const LABEL = LEAD_LABEL;

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const str = (k: string, max = 500) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");
  // honeypot: bots fill this; pretend success
  if (str("website")) return Response.json({ ok: true });

  const type = str("type");
  if (!(TYPES as readonly string[]).includes(type)) return Response.json({ ok: false, error: "Invalid type" }, { status: 400 });

  const name = str("name", 120);
  const phone = normalisePhone(str("phone", 30));
  if (!name) return Response.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  if (!phone) return Response.json({ ok: false, error: "Enter a valid Kenyan phone number (07xx or 01xx)." }, { status: 400 });
  if (b.consent !== true)
    return Response.json({ ok: false, error: "Please tick the consent box so we can contact you." }, { status: 400 });

  const details: Record<string, string> = {};
  if (type === "price_match" && !(Number(b.productId) > 0 && str("advertisedPrice"))) {
    return Response.json({ ok: false, error: "Choose the product and enter the advertised price." }, { status: 400 });
  }
  for (const k of ["message", "date", "slot", "plan", "employment", "answers", "competitor", "advertisedPrice", "link", "orderRef", "serial", "purchaseDate", "issue"]) {
    const v = str(k, 1000);
    if (v) details[k] = v;
  }
  const pid = Number(b.productId);
  const [lead] = await db
    .insert(leads)
    .values({
      type,
      name,
      phone,
      email: str("email", 200) || null,
      sourcePage: str("sourcePage", 200) || null,
      productId: Number.isInteger(pid) && pid > 0 ? pid : null,
      productName: str("productName", 200) || null,
      details,
    })
    .returning();

  const s = await getSettings();
  await db.insert(notifications).values({
    audience: "admin",
    recipient: s.whatsapp,
    subject: `New lead: ${LABEL[type]}`,
    message: `${LABEL[type]} from ${name} (${phone})${lead.productName ? ` about ${lead.productName}` : ""}${details.date ? ` · ${details.date} ${details.slot ?? ""}` : ""}. Source: ${lead.sourcePage ?? "n/a"}`,
    refType: "lead",
    refId: lead.id,
  });
  return Response.json({ ok: true });
}
