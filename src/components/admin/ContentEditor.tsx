"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveContent } from "@/app/admin/actions";
import { ImageField } from "@/components/admin/ImageField";
import type { Field, Item } from "@/lib/content-schema";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>;
}

function FieldInput({ f, id, value, onChange }: { f: Field; id: string; value: string; onChange: (v: string) => void }) {
  if (f.type === "image") return <ImageField value={value ? [value] : []} onChange={(u) => onChange(u[0] ?? "")} />;
  if (f.type === "select")
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {f.options?.map((o) => <option key={o} value={o}>{o || "None"}</option>)}
      </select>
    );
  if (f.type === "textarea")
    return <textarea id={id} rows={f.key === "body" ? 16 : 3} value={value} onChange={(e) => onChange(e.target.value)} className="input" />;
  return <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input" />;
}

export function ContentEditor({
  blockKey,
  fields,
  itemLabel,
  initial,
}: {
  blockKey: string;
  fields: Field[];
  itemLabel?: string;
  initial: Item | Item[];
}) {
  const isList = Array.isArray(initial);
  const nextKey = useRef(0);
  const row = (v: Item) => ({ k: nextKey.current++, v });
  const [rows, setRows] = useState(() => (Array.isArray(initial) ? initial : [initial]).map(row));

  const setField = (k: number, key: string, value: string) =>
    setRows((r) => r.map((x) => (x.k === k ? { ...x, v: { ...x.v, [key]: value } } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, f.options?.[0] ?? ""]));

  return (
    <form action={saveContent} className="grid gap-3">
      <input type="hidden" name="key" value={blockKey} />
      <input type="hidden" name="json" value={JSON.stringify(isList ? rows.map((r) => r.v) : rows[0].v)} />
      {rows.map((r, i) => (
        <section key={r.k} className="card grid gap-3 p-4">
          {isList && (
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{itemLabel} {i + 1}</h2>
              <div className="ml-auto flex gap-1">
                <button type="button" className="btn btn-outline !px-3" disabled={i === 0} aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="btn btn-outline !px-3" disabled={i === rows.length - 1} aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="btn btn-outline !border-red-600 !text-red-700" onClick={() => setRows((x) => x.filter((y) => y.k !== r.k))}>Remove</button>
              </div>
            </div>
          )}
          {fields.map((f) => {
            const id = `${r.k}-${f.key}`;
            return (
              <div key={f.key}>
                <label className="label" htmlFor={id}>{f.label}</label>
                <FieldInput f={f} id={id} value={r.v[f.key] ?? ""} onChange={(v) => setField(r.k, f.key, v)} />
                {f.hint && <p className="mt-0.5 text-xs text-slate-500">{f.hint}</p>}
              </div>
            );
          })}
        </section>
      ))}
      {isList && (
        <button type="button" className="btn btn-outline w-fit" onClick={() => setRows((r) => [...r, row(blank())])}>+ Add {itemLabel?.toLowerCase()}</button>
      )}
      <div className="sticky bottom-0 -mx-3 bg-slate-100/95 p-3 sm:mx-0">
        <SaveButton />
      </div>
    </form>
  );
}
