import { desc } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const esc = (v: unknown, customerText: boolean) => {
  let s =
    v == null ? "" : v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("|") : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Customer-typed text must not run as a spreadsheet formula.
  if (customerText && typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv(rows: Record<string, unknown>[], customerText: boolean) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c], customerText)).join(","))].join("\n");
}

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  const roles: Record<string, string[]> = { products: ["content", "pricing"], orders: ["sales", "fulfilment"], customers: ["sales"] };
  const allowed = admin.role === "owner" || (roles[kind] ?? []).includes(admin.role);
  if (!allowed) return new Response("Forbidden", { status: 403 });
  let rows: Record<string, unknown>[];
  if (kind === "products") rows = await db.select().from(products).orderBy(products.id);
  else if (kind === "orders") rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  else if (kind === "customers") rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
  else return new Response("Not found", { status: 404 });
  return new Response(toCsv(rows, kind !== "products"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}.csv"` },
  });
}
