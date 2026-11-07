"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { TrackedLink } from "@/components/TrackedLink";
import { waLink } from "@/lib/format";

export function ActionBar({ whatsapp, phoneTel }: { whatsapp: string; phoneTel: string }) {
  const path = usePathname();
  const { count } = useCart();
  const page = path === "/" ? "your homepage" : path.replace(/^\//, "").replace(/[-/]/g, " ");
  const href = waLink(whatsapp, `Hi, I'm looking at the "${page}" page on your website and have a question.`);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <TrackedLink href={href} event="whatsapp_click" external className="btn btn-wa !px-2">💬 WhatsApp</TrackedLink>
        <TrackedLink href={`tel:${phoneTel}`} event="call_click" className="btn btn-brand !px-2">📞 Call</TrackedLink>
        <Link href="/cart" className="btn btn-outline !px-2">🛒 Cart ({count})</Link>
      </div>
      <TrackedLink
        href={href}
        event="whatsapp_click"
        external
        label="Chat on WhatsApp"
        className="btn btn-wa fixed bottom-6 right-6 z-40 hidden !rounded-full !px-5 shadow-xl lg:inline-flex"
      >
        💬 Chat on WhatsApp
      </TrackedLink>
    </>
  );
}
