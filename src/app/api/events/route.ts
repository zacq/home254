import { db } from "@/db";
import { events } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "whatsapp_click",
  "call_click",
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "purchase",
  "quiz_complete",
  "booking_submit",
  "financing_submit",
  "view_item_list",
  "add_to_wishlist",
  "rewards_signup",
  "points_redeemed",
  "nudge_shown",
  "nudge_accepted",
  "mega_menu_open",
  "filter_used",
  "price_match_request",
  "review_submitted",
]);

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!ALLOWED.has(b?.name)) return Response.json({ ok: false }, { status: 400 });
    await db.insert(events).values({
      name: b.name,
      productId: Number.isInteger(b.productId) ? b.productId : null,
      page: typeof b.page === "string" ? b.page.slice(0, 200) : null,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
