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

  const tool = "w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white hover:text-primary";
  return (
    <div className="rounded-xl ring-1 ring-border overflow-hidden bg-white">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-surface border-b border-border">
        <button type="button" className={tool} onClick={() => wrap("**")} title="Tebal"><Bold size={15} /></button>
        <button type="button" className={tool} onClick={() => wrap("*")} title="Miring"><Italic size={15} /></button>
        <button type="button" className={tool} onClick={() => linePrefix("## ")} title="Judul"><Heading2 size={15} /></button>
        <button type="button" className={tool} onClick={() => linePrefix("- ")} title="Daftar"><List size={15} /></button>
        <button type="button" className={tool} onClick={() => wrap("[", "](https://)", "teks tautan")} title="Tautan"><Link2 size={15} /></button>
        <div className="ml-auto flex text-xs rounded-lg bg-white ring-1 ring-border overflow-hidden">
          <button type="button" onClick={() => setPreview(false)} className={`px-3 py-1.5 ${!preview ? "bg-primary text-white" : "text-neutral-500"}`}>Tulis</button>
          <button type="button" onClick={() => setPreview(true)} className={`px-3 py-1.5 ${preview ? "bg-primary text-white" : "text-neutral-500"}`}>Pratinjau</button>
        </div>
      </div>
      {preview ? (
        <div className="p-4 min-h-[14rem] text-neutral-700 leading-relaxed text-[15px]">
          {value.trim() ? renderMarkdown(value) : <p className="text-neutral-400">Belum ada isi.</p>}
        </div>
      ) : (
        <textarea ref={ref} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 text-sm leading-relaxed focus:outline-none resize-y" placeholder="Tulis isi artikel di sini…" />
      )}
    </div>
  );
}
