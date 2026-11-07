export type ProseBlock = { kind: "h2" | "p"; text: string } | { kind: "ul"; items: string[] };
export type ProseSpan = { kind: "text" | "bold"; text: string } | { kind: "link"; text: string; href: string };

// Editors write plain text: "## Heading", "- list item", **bold**, [label](/link).
export function parseProse(body: string): ProseBlock[] {
  const out: ProseBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      out.push({ kind: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flush();
      const last = out[out.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2).trim());
      else out.push({ kind: "ul", items: [line.slice(2).trim()] });
    } else para.push(line);
  }
  flush();
  return out;
}

const SAFE_HREF = /^(\/|#|https?:|mailto:|tel:)/i;

export function parseSpans(text: string): ProseSpan[] {
  const out: ProseSpan[] = [];
  let last = 0;
  for (const m of text.matchAll(/\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    if (m[1]) out.push({ kind: "bold", text: m[1] });
    else if (SAFE_HREF.test(m[3])) out.push({ kind: "link", text: m[2], href: m[3] });
    else out.push({ kind: "text", text: m[2] });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}
