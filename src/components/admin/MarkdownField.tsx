"use client";

import { useRef, useState } from "react";
import { Bold, Italic, List, Link2, Heading2 } from "lucide-react";
import { renderMarkdown } from "@/lib/rich";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const tool = "size-8 text-muted-foreground";
  return (
    <div className="overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
      <div className="flex items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        <Button type="button" variant="ghost" size="icon" className={tool} onClick={() => wrap("**")} title="Tebal" aria-label="Tebal"><Bold /></Button>
        <Button type="button" variant="ghost" size="icon" className={tool} onClick={() => wrap("*")} title="Miring" aria-label="Miring"><Italic /></Button>
        <Button type="button" variant="ghost" size="icon" className={tool} onClick={() => linePrefix("## ")} title="Judul" aria-label="Judul"><Heading2 /></Button>
        <Button type="button" variant="ghost" size="icon" className={tool} onClick={() => linePrefix("- ")} title="Daftar" aria-label="Daftar"><List /></Button>
        <Button type="button" variant="ghost" size="icon" className={tool} onClick={() => wrap("[", "](https://)", "teks tautan")} title="Tautan" aria-label="Tautan"><Link2 /></Button>
        <Tabs value={preview ? "preview" : "write"} onValueChange={(v) => setPreview(v === "preview")} className="ml-auto">
          <TabsList className="h-8" aria-label="Mode">
            <TabsTrigger value="write" className="px-3 text-[13px]">Tulis</TabsTrigger>
            <TabsTrigger value="preview" className="px-3 text-[13px]">Pratinjau</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {preview ? (
        // renderMarkdown dibuat untuk halaman publik (kelas neutral-*, text-accent); di sini warnanya dipaksa mengikuti tema admin agar terbaca di mode gelap.
        <div className="min-h-[14rem] p-4 text-[15px] leading-relaxed [&_a]:text-primary [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:text-foreground [&_p]:my-3 [&_strong]:text-foreground [&_ul]:my-3 [&_ol]:my-3 [&_blockquote]:text-muted-foreground">
          {value.trim() ? renderMarkdown(value) : <p className="text-muted-foreground">Belum ada isi.</p>}
        </div>
      ) : (
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
          placeholder="Tulis isi artikel di sini…"
          aria-label="Isi"
        />
      )}
    </div>
  );
}
