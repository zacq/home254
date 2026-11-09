"use client";

import { useEffect, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";

// Filters sit in a drawer on phones and in the left column on desktop (PRD FR-13).
export function FilterPanel({ children, count, active }: { children: ReactNode; count: number; active: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="btn btn-outline w-full lg:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide filters" : `Filter & sort${active ? ` (${active} active)` : ""} · ${count} results`}
      </button>
      <div className={`${open ? "block" : "hidden"} mt-3 lg:mt-0 lg:block`}>{children}</div>
    </div>
  );
}

export function FilterTracker({ active }: { active: number }) {
  useEffect(() => {
    if (active > 0) track("filter_used", { count: active });
  }, [active]);
  return null;
}
