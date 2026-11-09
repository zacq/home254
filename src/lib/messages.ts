import { db } from "@/db";
import { notifications } from "@/db/schema";

type Msg = { audience: "customer" | "admin"; recipient: string; subject: string; message: string; refType?: string; refId?: number };

// Messages are queued in the outbox; staff send them from admin until SMS/WhatsApp APIs are connected.
export async function queueMessage(m: Msg, channel: "whatsapp" | "sms" = "whatsapp") {
  await db.insert(notifications).values({ channel, ...m });
}

// Stub until an SMS provider (e.g. Africa's Talking) is connected: the code waits in the
// admin outbox under Messages → SMS, where staff can forward it. Replace this body to go live.
export async function sendSms(phone: string, subject: string, message: string) {
  await queueMessage({ audience: "customer", recipient: phone, subject, message }, "sms");
}
