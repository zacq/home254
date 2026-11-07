"use client";

import { useRef, useState, type ChangeEvent } from "react";

const MAX_EDGE = 1600;

async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.82);
  // Safari cannot encode WebP and silently returns PNG.
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.82);
  if (!jpeg) throw new Error("Could not read that image");
  return jpeg;
}

async function upload(file: File) {
  const blob = await compress(file);
  const body = new FormData();
  body.set("file", blob, "photo");
  const res = await fetch("/api/admin/media", { method: "POST", body });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

export function ImageField({
  name,
  value,
  multiple,
  onChange,
}: {
  name?: string;
  value: string[];
  multiple?: boolean;
  onChange?: (urls: string[]) => void;
}) {
  const [urls, setUrls] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const update = (next: string[]) => {
    setUrls(next);
    onChange?.(next);
  };

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      let next = urls;
      for (const f of files) {
        const url = await upload(f);
        next = multiple ? [...next, url] : [url];
        update(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  function addLink() {
    const url = link.trim();
    if (!url) return;
    update(multiple ? [...urls, url] : [url]);
    setLink("");
  }

  return (
    <div className="grid gap-2">
      {name && <input type="hidden" name={name} value={urls.join("\n")} />}
      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <li key={u + i} className="w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 object-cover" />
              <div className="mt-1 flex justify-between text-xs font-semibold">
                {multiple && i > 0 ? (
                  <button type="button" className="min-h-8 underline" onClick={() => update([u, ...urls.filter((_, n) => n !== i)])}>Make main</button>
                ) : (
                  <span className="min-h-8 pt-1.5 text-slate-500">{multiple ? "Main" : ""}</span>
                )}
                <button type="button" className="min-h-8 text-red-700 underline" onClick={() => update(urls.filter((_, n) => n !== i))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className={`btn btn-outline w-fit ${busy ? "opacity-50" : ""}`}>
        {busy ? "Uploading…" : multiple ? "Add photos" : urls.length ? "Replace photo" : "Add photo"}
        <input ref={input} type="file" accept="image/*" multiple={multiple} disabled={busy} onChange={onFiles} className="sr-only" />
      </label>
      <p className="text-xs text-slate-500">Photos are resized and compressed automatically.</p>
      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold">Use an image link instead</summary>
        <div className="mt-2 flex gap-2">
          <input aria-label="Image link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="input" />
          <button type="button" className="btn btn-outline" onClick={addLink}>Add</button>
        </div>
      </details>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
