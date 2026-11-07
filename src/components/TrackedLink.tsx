"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

export function TrackedLink({
  href,
  event,
  productId,
  className,
  children,
  external,
  label,
}: {
  href: string;
  event: "whatsapp_click" | "call_click";
  productId?: number;
  className?: string;
  children: ReactNode;
  external?: boolean;
  label?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => track(event, { productId })}
    >
      {children}
    </a>
  );
}
