import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

function base32Encode(buf: Buffer) {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return out;
}

function base32Decode(s: string) {
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase()) bits += ALPHABET.indexOf(c).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export const newTotpSecret = () => base32Encode(crypto.randomBytes(20));

export function totpCode(secret: string, counter: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const n = h.readUInt32BE(o) & 0x7fffffff;
  return String(n % 1_000_000).padStart(6, "0");
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  return [-1, 0, 1].some((d) => totpCode(secret, counter + d) === c);
}

export const totpUri = (secret: string, account: string, issuer: string) =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
