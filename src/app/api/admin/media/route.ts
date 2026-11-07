import { db } from "@/db";
import { media } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/orders";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2_500_000;
const TYPES = ["image/webp", "image/jpeg", "image/png"];

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin || admin.role === "sales") return Response.json({ ok: false, error: "Not allowed" }, { status: 401 });
  const file = (await req.formData()).get("file");
  if (!file || typeof file === "string") return Response.json({ ok: false, error: "No file" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ ok: false, error: "Use a JPG, PNG or WebP image" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ ok: false, error: "That image is too large" }, { status: 413 });
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const [row] = await db.insert(media).values({ contentType: file.type, data, bytes: file.size }).returning({ id: media.id });
  await logAudit(admin.username, "upload", "media", row.id);
  return Response.json({ ok: true, url: `/media/${row.id}` });
}
