import crypto from "node:crypto";
import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { adminUsers, type AdminUser } from "@/db/schema";
import { verifyTotp } from "@/lib/totp";

const COOKIE = "admin_session";
const SESSION_HOURS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export const MIN_PASSWORD_LENGTH = 10;
export const ROLES = ["owner", "pricing", "sales", "content", "fulfilment"] as const;
export type Role = (typeof ROLES)[number];
export type Admin = { id: number; username: string; name: string; role: Role };

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";

// The password hash is part of the signature, so changing a password ends existing sessions.
const sign = (payload: string, passwordHash: string) =>
  crypto.createHmac("sha256", secret()).update(`${payload}.${passwordHash}`).digest("hex");

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function passwordMatches(password: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export async function createSession(user: Pick<AdminUser, "id" | "passwordHash">) {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${user.id}.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload, user.passwordHash)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (!secret()) return null;
  const jar = await cookies();
  const parts = jar.get(COOKIE)?.value.split(".") ?? [];
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!(Number(exp) > Date.now()) || !Number.isInteger(Number(id))) return null;
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, Number(id))).limit(1);
  if (!u || !u.active) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${id}.${exp}`, u.passwordHash));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { id: u.id, username: u.username, name: u.name, role: u.role as Role };
});

async function ensureOwner() {
  const [{ n }] = await db.select({ n: count() }).from(adminUsers);
  if (n > 0) return;
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < MIN_PASSWORD_LENGTH) return;
  await db
    .insert(adminUsers)
    .values({ username: (process.env.ADMIN_USERNAME || "owner").toLowerCase(), name: "Owner", role: "owner", passwordHash: hashPassword(password) })
    .onConflictDoNothing();
}

export async function authenticate(
  username: string,
  password: string,
  code: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  if (!secret()) return { ok: false, error: "Admin login is not configured. Set ADMIN_SECRET and redeploy." };
  await ensureOwner();
  const wrong = { ok: false as const, error: "Wrong username, password or code." };
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.username, username.toLowerCase())).limit(1);
  if (!u || !u.active) return wrong;
  if (u.lockedUntil && u.lockedUntil > new Date()) return { ok: false, error: `Too many attempts. Try again in ${LOCK_MINUTES} minutes.` };

  const valid = passwordMatches(password, u.passwordHash) && (!u.totpEnabled || (!!u.totpSecret && verifyTotp(u.totpSecret, code)));
  if (!valid) {
    const fails = u.failedLogins + 1;
    const locked = fails >= MAX_FAILED_LOGINS;
    await db
      .update(adminUsers)
      .set({ failedLogins: locked ? 0 : fails, lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null })
      .where(eq(adminUsers.id, u.id));
    return wrong;
  }
  await db.update(adminUsers).set({ failedLogins: 0, lockedUntil: null }).where(eq(adminUsers.id, u.id));
  return { ok: true, user: u };
}
