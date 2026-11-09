"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { MAX_COMPARE } from "@/lib/format";

const KEY = "compare.v1";
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, ids.join(","));
  } catch {
    return;
  }
  listeners.forEach((fn) => fn());
}

function useCompare() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const ids = useMemo(() => raw.split(",").map(Number).filter((n) => n > 0), [raw]);
  return {
    ids,
    toggle: (id: number) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(0, MAX_COMPARE)),
    clear: () => write([]),
  };
}

export function CompareToggle({ id, compact }: { id: number; compact?: boolean }) {
  const { ids, toggle } = useCompare();
  const on = ids.includes(id);
  const full = !on && ids.length >= MAX_COMPARE;
  if (compact)
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        disabled={full}
        aria-pressed={on}
        title={full ? `Compare full (${MAX_COMPARE})` : "Compare"}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[1.5px] text-sm font-bold ${on ? "border-brand bg-brand text-white" : "border-slate-300 text-slate-600"} disabled:opacity-40`}
      >
        <span aria-hidden>⇄</span>
        <span className="sr-only">{on ? "Remove from compare" : "Add to compare"}</span>
      </button>
    );
  return (
    <label className={`flex min-h-11 items-center gap-2 text-xs font-semibold ${full ? "text-slate-400" : "text-slate-700"}`}>
      <input type="checkbox" className="h-5 w-5" checked={on} disabled={full} onChange={() => toggle(id)} />
      {full ? `Compare full (${MAX_COMPARE})` : "Add to compare"}
    </label>
  );
}

export function CompareBar() {
  const { ids, clear } = useCompare();
  if (!ids.length) return null;
  return (
    <div className="fixed inset-x-3 bottom-[4.5rem] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-brand-dark p-2 pl-4 text-sm text-white shadow-xl print:hidden lg:bottom-6 lg:left-6 lg:right-auto lg:mx-0">
      <span className="font-semibold">{ids.length} of {MAX_COMPARE} to compare</span>
      <button className="ml-auto min-h-11 px-2 underline" onClick={clear}>Clear</button>
      <Link href={`/compare?ids=${ids.join(",")}`} className="btn btn-primary">Compare</Link>
    </div>
  );
}

export function CompareRemove({ id }: { id: number }) {
  const { ids, toggle } = useCompare();
  const router = useRouter();
  return (
    <button
      className="min-h-11 text-xs font-semibold text-red-700 underline"
      onClick={() => {
        const rest = ids.filter((x) => x !== id);
        if (ids.includes(id)) toggle(id);
        router.push(`/compare?ids=${rest.join(",")}`);
      }}
    >
      Remove
    </button>
  );
}
