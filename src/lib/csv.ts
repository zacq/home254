export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!header) return [];
  const cols = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? "").trim()])));
}

const REQUIRED_TEXT = ["name", "brand", "category", "type", "motor", "warranty", "shortBenefit", "description"];
const OPTIONAL_TEXT = ["energyRating", "offerBadge", "colour", "dimensionsCm", "videoUrl", "manualPdf", "seoTitle", "metaDescription"];
const REQUIRED_INT = ["priceKsh", "stockQty", "lowStockAt", "popularity"];
const OPTIONAL_INT = ["washCapacityKg", "dryCapacityKg", "spinRpm", "offerPriceKsh", "weightKg"];
const BOOLS = ["featured", "archived"];
const LISTS = ["features", "images"];
const DATES = ["offerStart", "offerEnd"];

const toInt = (v: string) => {
  const n = Number(v.replace(/,/g, ""));
  return v !== "" && Number.isFinite(n) ? Math.round(n) : null;
};

// Maps only the columns present in the CSV, so a partial file leaves other fields alone.
export function productFieldsFromCsv(r: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const k of REQUIRED_TEXT) if (r[k]) out[k] = r[k];
  for (const k of OPTIONAL_TEXT) if (k in r) out[k] = r[k] || null;
  for (const k of REQUIRED_INT) if (k in r && toInt(r[k]) != null) out[k] = toInt(r[k]);
  for (const k of OPTIONAL_INT) if (k in r) out[k] = toInt(r[k]);
  for (const k of BOOLS) if (k in r) out[k] = /^(true|1|yes)$/i.test(r[k]);
  for (const k of LISTS) if (k in r) out[k] = r[k].split("|").map((s) => s.trim()).filter(Boolean);
  for (const k of DATES) {
    if (!(k in r)) continue;
    const d = r[k] ? new Date(r[k]) : null;
    out[k] = d && !Number.isNaN(d.getTime()) ? d : null;
  }
  return out;
}
