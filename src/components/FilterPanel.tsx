"use client";

import { useState, type ReactNode } from "react";

export function FilterPanel({ children, count }: { children: ReactNode; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="btn btn-outline w-full lg:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide filters" : `Filters & sort (${count} results)`}
      </button>
      <div className={`${open ? "block" : "hidden"} mt-3 lg:mt-0 lg:block`}>{children}</div>
    </div>
  );
}
