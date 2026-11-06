"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
        <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
          <span className={cn("relative shrink-0 overflow-hidden rounded-md bg-muted", square ? "h-20 w-20" : "h-20 w-32")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau unggahan, bukan aset situs */}
            <img src={value} alt="Pratinjau" className="h-full w-full object-cover" />
            {busy && <span className="absolute inset-0 flex items-center justify-center bg-background/70"><Loader2 className="size-5 animate-spin text-primary" /></span>}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>Ganti foto</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange("")} disabled={busy} className="text-destructive hover:bg-destructive/10 hover:text-destructive">Hapus</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
          className={cn(
            "flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed py-7 text-center outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            drag ? "border-primary bg-primary/5" : "bg-muted/40 hover:bg-muted/70",
          )}
        >
          {busy ? <Loader2 className="size-6 animate-spin text-primary" /> : <ImagePlus className="size-6 text-primary" strokeWidth={1.6} />}
          <span className="text-sm font-medium">{busy ? "Mengunggah…" : "Pilih atau tarik foto ke sini"}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Otomatis dikompres.</span>
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-destructive">{error}</p>}
    </div>
  );
}
