"use client";

import { useRef, useState } from "react";
import { Bold, Italic, List, Link2, Heading2 } from "lucide-react";
import { renderMarkdown } from "@/lib/rich";

export default function MarkdownField({ value, onChange, rows = 10 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function wrap(before: string, after = before, placeholder = "teks") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || placeholder;
    onChange(value.slice(0, a) + before + sel + after + value.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length); });
  }
  function linePrefix(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const a = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    onChange(value.slice(0, a) + prefix + value.slice(a));
    requestAnimationFrame(() => el.focus());
  }

  const tool = "ad-icon-btn !h-8 !w-8";
  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--ad-line-strong)] bg-white focus-within:border-[var(--ad-blue)] focus-within:shadow-[0_0_0_4px_rgba(0,113,227,0.2)] transition-shadow">
      <div className="flex items-center gap-0.5 border-b border-[var(--ad-line)] bg-[rgba(0,0,0,0.02)] px-2 py-1.5">
        <button type="button" className={tool} onClick={() => wrap("**")} title="Tebal" aria-label="Tebal"><Bold size={16} /></button>
        <button type="button" className={tool} onClick={() => wrap("*")} title="Miring" aria-label="Miring"><Italic size={16} /></button>
        <button type="button" className={tool} onClick={() => linePrefix("## ")} title="Judul" aria-label="Judul"><Heading2 size={16} /></button>
        <button type="button" className={tool} onClick={() => linePrefix("- ")} title="Daftar" aria-label="Daftar"><List size={16} /></button>
        <button type="button" className={tool} onClick={() => wrap("[", "](https://)", "teks tautan")} title="Tautan" aria-label="Tautan"><Link2 size={16} /></button>
        <div className="ad-seg ml-auto" role="tablist" aria-label="Mode">
          <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)}>Tulis</button>
          <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)}>Pratinjau</button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-[14rem] p-4 text-[15px] leading-relaxed text-[var(--ad-ink-2)]">
          {value.trim() ? renderMarkdown(value) : <p className="text-[var(--ad-faint)]">Belum ada isi.</p>}
        </div>
      ) : (
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-[#a1a1a6]"
          placeholder="Tulis isi artikel di sini…"
          aria-label="Isi"
        />
      )}
    </div>
  );
}
