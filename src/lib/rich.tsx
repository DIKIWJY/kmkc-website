import React from "react";

/** Ubah penanda **tebal** di string menjadi <strong>. Aman (tidak memakai innerHTML). */
export function renderBold(text: string, strongClass = "font-semibold text-neutral-800") {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={strongClass}>
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

/* ---------- Markdown mini (untuk isi artikel) — render ke elemen React, tanpa innerHTML ---------- */

function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("*")) out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      out.push(
        <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
          {label}
        </a>
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(src: string): React.ReactNode {
  const blocks = src.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-1.5 my-5">
          {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>)}
        </ul>
      );
    }
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      return (
        <ol key={i} className="list-decimal pl-6 space-y-1.5 my-5">
          {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>)}
        </ol>
      );
    }
    if (lines.every((l) => /^\s*>\s?/.test(l))) {
      return (
        <blockquote key={i} className="article-quote">
          {inline(lines.map((l) => l.replace(/^\s*>\s?/, "")).join(" "))}
        </blockquote>
      );
    }
    const h = /^(#{2,3})\s+(.*)$/.exec(block);
    if (h) {
      return h[1] === "##" ? (
        <h2 key={i} className="text-2xl font-bold text-neutral-900 mt-10 mb-3">{inline(h[2])}</h2>
      ) : (
        <h3 key={i} className="text-xl font-bold text-neutral-900 mt-8 mb-2">{inline(h[2])}</h3>
      );
    }
    return (
      <p key={i} className="my-5">
        {lines.flatMap((l, j) => (j ? [<br key={`b${j}`} />, ...inline(l)] : inline(l)))}
      </p>
    );
  });
}

/** Perkiraan waktu baca (menit) — ±200 kata per menit. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
