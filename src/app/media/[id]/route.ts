import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const [m] = await db.select().from(media).where(eq(media.id, Number(id))).limit(1);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(m.data, "base64")), {
    headers: {
      "Content-Type": m.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
