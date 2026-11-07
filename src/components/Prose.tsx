import Link from "next/link";
import { parseProse, parseSpans } from "@/lib/prose";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseSpans(text).map((s, i) => {
        if (s.kind === "bold") return <b key={i}>{s.text}</b>;
        if (s.kind === "link")
          return s.href.startsWith("/") ? (
            <Link key={i} href={s.href} className="underline">{s.text}</Link>
          ) : (
            <a key={i} href={s.href} className="underline">{s.text}</a>
          );
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}

export function Prose({ body }: { body: string }) {
  return (
    <>
      {parseProse(body).map((b, i) => {
        if (b.kind === "ul")
          return (
            <ul key={i}>
              {b.items.map((t, n) => <li key={n}><Inline text={t} /></li>)}
            </ul>
          );
        return b.kind === "h2" ? <h2 key={i}>{b.text}</h2> : <p key={i}><Inline text={b.text} /></p>;
      })}
    </>
  );
}
