"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { ARCHIVE_SECTIONS, archiveQuery, type ArchiveKey } from "@/lib/admin/archive-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "./ui";
import { CheckRow, SwitchRow } from "./report-controls";

/** Form penyusun laporan: pilih bagian, periode, dan opsi, lalu buka halaman laporan siap-PDF di tab baru. */
export default function ArchiveBuilder() {
  const [sel, setSel] = useState<Set<ArchiveKey>>(new Set(ARCHIVE_SECTIONS.map((s) => s.key)));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [proofs, setProofs] = useState(true);
  const [fullText, setFullText] = useState(false);
  const [photos, setPhotos] = useState(false);

  const toggle = (k: ArchiveKey, on: boolean) => setSel((p) => { const n = new Set(p); if (on) n.add(k); else n.delete(k); return n; });
  const all = sel.size === ARCHIVE_SECTIONS.length;
  const href = `/admin/arsip/laporan?${archiveQuery({ sections: ARCHIVE_SECTIONS.map((s) => s.key).filter((k) => sel.has(k)), from, to, proofs, fullText, photos, auto: true })}`;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-[13px] font-medium text-muted-foreground">Bagian yang dimasukkan</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSel(all ? new Set() : new Set(ARCHIVE_SECTIONS.map((s) => s.key)))}>{all ? "Kosongkan" : "Pilih semua"}</Button>
        </div>
        <div className="divide-y border-t">
          {ARCHIVE_SECTIONS.map((s) => (
            <CheckRow key={s.key} id={`arsip-${s.key}`} label={s.label} desc={s.desc} checked={sel.has(s.key)} onChange={(on) => toggle(s.key, on)} />
          ))}
        </div>
      </Card>

      <Card className="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="arsip-from">Dari tanggal</Label>
          <Input id="arsip-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="arsip-to">Sampai tanggal</Label>
          <Input id="arsip-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">Periode berlaku untuk pendaftar, pesan, berita, agenda, dan galeri. Kosongkan untuk semua data.</p>
      </Card>

      <Card className="divide-y">
        <SwitchRow id="arsip-proofs" label="Sertakan gambar bukti follow" desc="Tangkapan layar tiap pendaftar ikut tercetak di PDF. Cocok sebelum bukti dihapus dari penyimpanan." checked={proofs} onChange={setProofs} />
        <SwitchRow id="arsip-full" label="Isi lengkap berita" desc="Mencetak seluruh teks artikel, bukan hanya judul dan ringkasan." checked={fullText} onChange={setFullText} />
        <SwitchRow id="arsip-photos" label="Sertakan gambar galeri" desc="Menampilkan foto kegiatan. Ukuran PDF menjadi jauh lebih besar." checked={photos} onChange={setPhotos} />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {sel.size === 0 ? (
          <Button size="lg" disabled><FileDown /> Buat laporan PDF</Button>
        ) : (
          <Button asChild size="lg"><a href={href} target="_blank" rel="noreferrer"><FileDown /> Buat laporan PDF</a></Button>
        )}
        <p className="text-[13px] text-muted-foreground">
          {sel.size === 0 ? "Pilih minimal satu bagian untuk dimasukkan." : <>Laporan terbuka di tab baru. Pilih <b className="font-semibold text-foreground">Simpan sebagai PDF</b> pada dialog cetak.</>}
        </p>
      </div>
    </div>
  );
}
