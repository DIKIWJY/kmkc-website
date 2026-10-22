"use client";

import { useState } from "react";
import { FileDown, Check } from "lucide-react";
import { ARCHIVE_SECTIONS, archiveQuery, type ArchiveKey } from "@/lib/admin/archive-shared";

/** Form penyusun laporan: pilih bagian, periode, dan opsi, lalu buka halaman laporan siap-PDF di tab baru. */
export default function ArchiveBuilder() {
  const [sel, setSel] = useState<Set<ArchiveKey>>(new Set(ARCHIVE_SECTIONS.map((s) => s.key)));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [proofs, setProofs] = useState(true);
  const [fullText, setFullText] = useState(false);
  const [photos, setPhotos] = useState(false);

  const toggle = (k: ArchiveKey) => setSel((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const all = sel.size === ARCHIVE_SECTIONS.length;
  const href = `/admin/arsip/laporan?${archiveQuery({ sections: ARCHIVE_SECTIONS.map((s) => s.key).filter((k) => sel.has(k)), from, to, proofs, fullText, photos, auto: true })}`;

  const opt = (label: string, desc: string, on: boolean, set: (v: boolean) => void) => (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[15px]">{label}</p>
        <p className="text-[13px] text-[var(--ad-mute)]">{desc}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className="ad-switch" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="ad-card">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-[13px] font-medium text-[var(--ad-mute)]">Bagian yang dimasukkan</p>
          <button type="button" onClick={() => setSel(all ? new Set() : new Set(ARCHIVE_SECTIONS.map((s) => s.key)))} className="ad-btn ad-btn-plain ad-btn-sm">{all ? "Kosongkan" : "Pilih semua"}</button>
        </div>
        <ul className="ad-divide border-t border-[var(--ad-line)]">
          {ARCHIVE_SECTIONS.map((s) => (
            <li key={s.key}>
              <label className="ad-row cursor-pointer">
                <input type="checkbox" checked={sel.has(s.key)} onChange={() => toggle(s.key)} className="peer sr-only" />
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[var(--ad-line-strong)] text-transparent transition peer-checked:border-[var(--ad-blue)] peer-checked:bg-[var(--ad-blue)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ad-blue)] peer-focus-visible:ring-offset-2">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{s.label}</span>
                  <span className="block text-[13px] text-[var(--ad-mute)]">{s.desc}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="ad-card grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
        <div>
          <label className="ad-label" htmlFor="arsip-from">Dari tanggal</label>
          <input id="arsip-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="ad-input" />
        </div>
        <div>
          <label className="ad-label" htmlFor="arsip-to">Sampai tanggal</label>
          <input id="arsip-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="ad-input" />
        </div>
        <p className="ad-help !mt-0 sm:col-span-2">Periode berlaku untuk pendaftar, pesan, berita, agenda, dan galeri. Kosongkan untuk semua data.</p>
      </div>

      <div className="ad-card ad-divide">
        {opt("Sertakan gambar bukti follow", "Tangkapan layar tiap pendaftar ikut tercetak di PDF. Cocok sebelum bukti dihapus dari penyimpanan.", proofs, setProofs)}
        {opt("Isi lengkap berita", "Mencetak seluruh teks artikel, bukan hanya judul dan ringkasan.", fullText, setFullText)}
        {opt("Sertakan gambar galeri", "Menampilkan foto kegiatan. Ukuran PDF menjadi jauh lebih besar.", photos, setPhotos)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a href={href} target="_blank" rel="noreferrer" aria-disabled={sel.size === 0} className="ad-btn ad-btn-primary ad-btn-lg">
          <FileDown size={18} /> Buat laporan PDF
        </a>
        <p className="text-[13px] text-[var(--ad-mute)]">Laporan terbuka di tab baru. Pilih <b className="font-semibold text-[var(--ad-ink-2)]">Simpan sebagai PDF</b> pada dialog cetak.</p>
      </div>
    </div>
  );
}
