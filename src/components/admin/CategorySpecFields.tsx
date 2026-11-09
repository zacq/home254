"use client";

import { useState } from "react";
import { CATALOG, LAUNDRY_FEATURES, WASHER_TYPES } from "@/lib/catalog";

type Laundry = { washCapacityKg: number | null; dryCapacityKg: number | null; spinRpm: number | null; motor: string; features: string[] };

// Category picker plus that category's spec template, so filters and comparison work (PRD CT-3).
export function CategorySpecFields({
  catsub,
  type,
  energyRating,
  specs,
  laundry,
  extraSubs,
}: {
  catsub: string;
  type: string;
  energyRating: string;
  specs: Record<string, string>;
  laundry: Laundry;
  extraSubs: { parent: string; slug: string; name: string }[];
}) {
  const [value, setValue] = useState(catsub);
  const cat = value.split("/")[0];
  const def = CATALOG.find((c) => c.slug === cat);
  const isWasher = cat === "washers";
  return (
    <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <h2 className="font-bold sm:col-span-2 lg:col-span-4">Category & specifications</h2>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="catsub">Category / sub-category</label>
        <select id="catsub" name="catsub" required value={value} onChange={(e) => setValue(e.target.value)} className="input">
          <option value="">Choose…</option>
          {CATALOG.map((c) => (
            <optgroup key={c.slug} label={c.name}>
              {[...c.subs, ...extraSubs.filter((x) => x.parent === c.slug && !c.subs.some((s) => s.slug === x.slug))].map((s) => (
                <option key={s.slug} value={`${c.slug}/${s.slug}`}>{c.name} › {s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="type">Type (shown in the Type filter)</label>
        <input id="type" name="type" list="type-options" defaultValue={type} className="input" placeholder="e.g. Smart TV, Double-door" />
        <datalist id="type-options">{(isWasher ? WASHER_TYPES : def?.subs.map((s) => s.name) ?? []).map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      {(isWasher || cat === "fridges") && (
        <div>
          <label className="label" htmlFor="energyRating">Energy rating</label>
          <select id="energyRating" name="energyRating" defaultValue={energyRating} className="input">
            <option value="">—</option>
            {["A+++", "A++", "A+", "A", "B", "C"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      )}
      {isWasher && (
        <>
          <div><label className="label" htmlFor="washCapacityKg">Wash capacity (kg)</label><input id="washCapacityKg" name="washCapacityKg" type="number" inputMode="numeric" defaultValue={laundry.washCapacityKg ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="dryCapacityKg">Dry capacity (kg)</label><input id="dryCapacityKg" name="dryCapacityKg" type="number" inputMode="numeric" defaultValue={laundry.dryCapacityKg ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="spinRpm">Spin (RPM)</label><input id="spinRpm" name="spinRpm" type="number" inputMode="numeric" defaultValue={laundry.spinRpm ?? ""} className="input" /></div>
          <div>
            <label className="label" htmlFor="motor">Motor</label>
            <select id="motor" name="motor" defaultValue={laundry.motor} className="input">
              <option>Brushless inverter (BLDC)</option>
              <option>Standard</option>
            </select>
          </div>
          <fieldset className="sm:col-span-2 lg:col-span-4">
            <legend className="label">Features</legend>
            <div className="flex flex-wrap gap-x-5">
              {LAUNDRY_FEATURES.map((f) => (
                <label key={f} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="features" value={f} defaultChecked={laundry.features.includes(f)} className="h-5 w-5" /> {f}</label>
              ))}
            </div>
          </fieldset>
        </>
      )}
      {def?.specs.map((s) => (
        <div key={`${cat}-${s.key}`}>
          <label className="label" htmlFor={`spec_${s.key}`}>{s.label}{s.unit && s.unit !== "\"" ? ` (${s.unit})` : s.unit ? " (inches)" : ""}</label>
          {s.type === "select" ? (
            <select id={`spec_${s.key}`} name={`spec_${s.key}`} defaultValue={specs[s.key] ?? ""} className="input">
              <option value="">—</option>
              {s.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input id={`spec_${s.key}`} name={`spec_${s.key}`} type={s.type === "number" ? "number" : "text"} inputMode={s.type === "number" ? "numeric" : undefined} defaultValue={specs[s.key] ?? ""} className="input" />
          )}
        </div>
      ))}
    </section>
  );
}
