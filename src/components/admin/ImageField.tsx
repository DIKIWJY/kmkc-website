"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/image";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  maxSize?: number;
  square?: boolean;
}

export default function ImageField({ value, onChange, folder, maxSize = 1920, square }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  async function handle(file?: File | null) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("File harus berupa gambar (JPG, PNG, WebP).");
    if (file.size > 25 * 1024 * 1024) return setError("Ukuran file terlalu besar (maks 25 MB).");
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder, maxSize));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-4 rounded-xl border border-[var(--ad-line-strong)] bg-white p-3">
          <span className={`relative shrink-0 overflow-hidden rounded-[10px] bg-[var(--ad-fill)] ${square ? "h-20 w-20" : "h-20 w-32"}`}>
            <img src={value} alt="Pratinjau" className="h-full w-full object-cover" />
            {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="animate-spin text-[var(--ad-blue)]" size={20} /></span>}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="ad-btn ad-btn-sm">Ganti foto</button>
            <button type="button" onClick={() => onChange("")} disabled={busy} className="ad-btn ad-btn-sm ad-btn-danger">Hapus</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
          className={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed py-7 text-center transition-colors ${
            drag ? "border-[var(--ad-blue)] bg-[var(--ad-blue-soft)]" : "border-[var(--ad-line-strong)] bg-[rgba(0,0,0,0.015)] hover:bg-[rgba(0,0,0,0.035)]"
          }`}
        >
          {busy ? <Loader2 className="animate-spin text-[var(--ad-blue)]" size={24} /> : <ImagePlus size={24} strokeWidth={1.6} className="text-[var(--ad-blue)]" />}
          <span className="text-[14px] font-medium">{busy ? "Mengunggah…" : "Pilih atau tarik foto ke sini"}</span>
          <span className="text-[12.5px] text-[var(--ad-mute)]">JPG, PNG, atau WebP. Otomatis dikompres.</span>
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-[var(--ad-red)]">{error}</p>}
    </div>
  );
}
