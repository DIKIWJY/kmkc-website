"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, UploadCloud } from "lucide-react";
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
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-border bg-surface">
          <img src={value} alt="Pratinjau" className={`w-full object-cover ${square ? "aspect-square" : "max-h-56"}`} />
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => input.current?.click()} className="px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-neutral-800 hover:bg-neutral-100">
              Ganti
            </button>
            <button type="button" onClick={() => onChange("")} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-red-600 hover:bg-white inline-flex items-center gap-1">
              <X size={14} /> Hapus
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
          className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 text-sm transition-colors ${
            drag ? "border-accent bg-accent/5 text-accent" : "border-border text-neutral-500 hover:border-accent/50 hover:text-accent"
          }`}
        >
          {busy ? <Loader2 className="animate-spin" size={26} /> : drag ? <UploadCloud size={26} /> : <ImagePlus size={26} />}
          <span className="font-medium">{busy ? "Mengunggah…" : "Klik atau tarik foto ke sini"}</span>
          <span className="text-xs text-neutral-400">JPG / PNG / WebP — otomatis dikompres</span>
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
