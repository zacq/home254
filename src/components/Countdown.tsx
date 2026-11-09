"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

// Counts down to a real offer end date; refreshes the page when it ends so the price reverts (PRD DE-2).
export function Countdown({ end, className = "" }: { end: string; className?: string }) {
  const router = useRouter();
  const target = new Date(end).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const left = now == null ? null : Math.max(0, target - now);
  useEffect(() => {
    if (left === 0) {
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [left, router]);
  if (left == null) return <span className={className}>&nbsp;</span>;
  if (left === 0) return <span className={className}>Offer ended</span>;
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <span className={className} role="timer" aria-label={`Offer ends in ${d} days ${h} hours ${m} minutes`}>
      Ends in {d > 0 ? `${d}d ` : ""}{pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
