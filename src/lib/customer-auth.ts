import crypto from "node:crypto";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { customers, otpCodes, type Customer } from "@/db/schema";
import { normalisePhone } from "@/lib/format";
import { sendSms } from "@/lib/messages";
import { addPoints, getRewardsConfig } from "@/lib/rewards";
import { getSettings } from "@/lib/settings";

const COOKIE = "member_session";
const SESSION_DAYS = 60;
const CODE_MINUTES = 10;
const MAX_SENDS = 3; // per phone per 15 minutes
const MAX_ATTEMPTS = 5; // per code

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(`member.${payload}`).digest("hex");
const hashCode = (phone: string, code: string) => crypto.createHmac("sha256", secret()).update(`otp.${phone}.${code}`).digest("hex");

export async function createCustomerSession(id: number) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `${id}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroyCustomerSession() {
  (await cookies()).delete(COOKIE);
}

// The signed-in Rewards member, or null for guests.
export const getCustomer = cache(async (): Promise<Customer | null> => {
  if (!secret()) return null;
  const parts = (await cookies()).get(COOKIE)?.value.split(".") ?? [];
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!(Number(exp) > Date.now()) || !Number.isInteger(Number(id))) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${id}.${exp}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const [c] = await db.select().from(customers).where(eq(customers.id, Number(id))).limit(1);
    return c?.joinedAt ? c : null;
  } catch {
    return null;
  }
});

export async function requestCode(rawPhone: string): Promise<{ ok: true; phone: string; devCode?: string } | { ok: false; error: string }> {
  if (!secret()) return { ok: false, error: "Sign-in is not configured yet." };
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid Kenyan phone number (07xx or 01xx)." };
  const recent = await db.select({ id: otpCodes.id }).from(otpCodes).where(and(eq(otpCodes.phone, phone), gte(otpCodes.createdAt, new Date(Date.now() - 15 * 60_000))));
  if (recent.length >= MAX_SENDS) return { ok: false, error: "Too many codes requested. Please wait 15 minutes and try again." };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({ phone, codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) });
  const s = await getSettings();
  await sendSms(phone, "Sign-in code", `Your ${s.storeName} code is ${code}. It expires in ${CODE_MINUTES} minutes. Never share it.`);
  return { ok: true, phone, ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}) };
}

export async function verifyCode(
  rawPhone: string,
  code: string,
  profile: { name?: string; email?: string; consent?: boolean },
): Promise<{ ok: true; customer: Customer; joined: boolean; bonus: number } | { ok: false; error: string }> {
  const phone = normalisePhone(rawPhone);
  if (!phone || !/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code we sent you." };
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.usedAt), gte(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!row) return { ok: false, error: "That code has expired. Request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many wrong attempts. Request a new code." };
  const a = Buffer.from(row.codeHash);
  const b = Buffer.from(hashCode(phone, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id));
    return { ok: false, error: "That code is not right. Check the SMS and try again." };
  }
  await db.update(otpCodes).set({ usedAt: new Date() }).where(eq(otpCodes.id, row.id));

  // One account per phone number (NF-6). A buyer who ordered as a guest already has a record.
  await db.insert(customers).values({ phone }).onConflictDoNothing();
  const [existing] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  // The isNull guard makes the welcome bonus once-only even if two verifications race.
  const joinedRows = await db
    .update(customers)
    .set({ joinedAt: new Date(), marketingConsent: !!profile.consent })
    .where(and(eq(customers.id, existing.id), isNull(customers.joinedAt)))
    .returning({ id: customers.id });
  const joined = joinedRows.length > 0;
  const name = profile.name?.trim().slice(0, 120);
  const email = profile.email?.trim().slice(0, 200);
  if (name || email) await db.update(customers).set({ ...(name ? { name } : {}), ...(email ? { email } : {}) }).where(eq(customers.id, existing.id));
  const [customer] = await db.select().from(customers).where(eq(customers.id, existing.id)).limit(1);
  let bonus = 0;
  if (joined) {
    const cfg = await getRewardsConfig();
    bonus = cfg.signupBonus;
    await addPoints({ customerId: customer.id, type: "bonus", points: bonus, reason: "Welcome bonus for joining" });
  }
  await createCustomerSession(customer.id);
  return { ok: true, customer, joined, bonus };
}
