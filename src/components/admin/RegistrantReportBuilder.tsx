"use client";

import { useMemo, useState } from "react";
import { FileDown, Check } from "lucide-react";
import { REG_STATUSES, defaultRegOptions, matchReg, regQuery, type RegLite, type RegOptions, type RegGroup, type RegSort } from "@/lib/admin/registrant-report";

interface Props {
  rows: RegLite[];
  villages: string[];
  campuses: string[];
  batches: string[];
}

/** Penyusun Laporan Pendaftar: saring, kelompokkan, pilih isi, lalu buka laporan siap-PDF. Jumlah hasil dihitung langsung. */
export default function RegistrantReportBuilder({ rows, villages, campuses, batches }: Props) {
  const [o, setO] = useState<RegOptions>(defaultRegOptions());
  const set = <K extends keyof RegOptions>(k: K, v: RegOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const toggleStatus = (s: string) => set("statuses", o.statuses.includes(s) ? o.statuses.filter((x) => x !== s) : [...o.statuses, s]);

  const matched = useMemo(() => rows.filter((r) => matchReg(r, o)), [rows, o]);
  const href = `/admin/arsip/pendaftar?${regQuery({ ...o, auto: true })}`;
  const ready = matched.length > 0 && o.statuses.length > 0;

  const sw = (label: string, desc: string, k: "stats" | "reason" | "proofs" | "contact" | "notes" | "sign", disabled = false) => (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 ${disabled ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-[15px]">{label}</p>
        <p className="text-[13px] text-[var(--ad-mute)]">{desc}</p>
      </div>
      <button type="button" role="switch" aria-checked={o[k] && !disabled} aria-label={label} disabled={disabled} onClick={() => set(k, !o[k])} className="ad-switch" />
    </div>
  );

  const select = (id: string, label: string, value: string, opts: string[], onChange: (v: string) => void, all: string) => (
    <div>
      <label className="ad-label" htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="ad-input">
        <option value="">{all}</option>
        {opts.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );

  const seg = <T extends string>(label: string, value: T, opts: [T, string][], onChange: (v: T) => void) => (
    <div>
      <p className="ad-label">{label}</p>
      <div className="ad-seg" role="group" aria-label={label}>
        {opts.map(([v, t]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="ad-card">
        <p className="px-4 pt-3 text-[13px] font-medium text-[var(--ad-mute)]">Status pendaftar</p>
        <ul className="grid grid-cols-2 sm:grid-cols-4">
          {REG_STATUSES.map((s) => {
            const n = rows.filter((r) => r.status === s.key).length;
            return (
              <li key={s.key}>
                <label className="ad-row cursor-pointer">
                  <input type="checkbox" checked={o.statuses.includes(s.key)} onChange={() => toggleStatus(s.key)} className="peer sr-only" />
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[var(--ad-line-strong)] text-transparent transition peer-checked:border-[var(--ad-blue)] peer-checked:bg-[var(--ad-blue)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ad-blue)] peer-focus-visible:ring-offset-2"><Check size={13} strokeWidth={3} /></span>
                  <span className="min-w-0"><span className="block text-[15px]">{s.label}</span><span className="block text-[12.5px] text-[var(--ad-mute)] tnum">{n} orang</span></span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="ad-card grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
        <div>
          <label className="ad-label" htmlFor="rp-from">Terdaftar dari</label>
          <input id="rp-from" type="date" value={o.from} max={o.to || undefined} onChange={(e) => set("from", e.target.value)} className="ad-input" />
        </div>
        <div>
          <label className="ad-label" htmlFor="rp-to">Sampai</label>
          <input id="rp-to" type="date" value={o.to} min={o.from || undefined} onChange={(e) => set("to", e.target.value)} className="ad-input" />
        </div>
        {select("rp-village", "Desa asal", o.village, villages, (v) => set("village", v), "Semua desa")}
        {select("rp-campus", "Perguruan tinggi", o.campus, campuses, (v) => set("campus", v), "Semua kampus")}
        {select("rp-batch", "Angkatan", o.batch, batches, (v) => set("batch", v), "Semua angkatan")}
      </div>

      <div className="ad-card grid gap-5 p-4 sm:grid-cols-2">
        {seg("Tampilan daftar", o.view, [["rekap", "Rekap tabel"], ["detail", "Detail per orang"]], (v) => set("view", v))}
        {seg<RegSort>("Urutkan", o.sort, [["new", "Terbaru"], ["old", "Terlama"], ["name", "Nama A–Z"]], (v) => set("sort", v))}
        <div className="sm:col-span-2">
          {seg<RegGroup>("Kelompokkan menurut", o.group, [["none", "Tanpa"], ["village", "Desa"], ["campus", "Kampus"], ["batch", "Angkatan"], ["status", "Status"]], (v) => set("group", v))}
        </div>
      </div>

      <div className="ad-card ad-divide">
        {sw("Ringkasan statistik", "Total, per status, per desa, per kampus, per angkatan, dan tren pendaftaran.", "stats")}
        {sw("Alasan bergabung", "Teks alasan tiap pendaftar ikut tercetak.", "reason")}
        {sw("Gambar bukti follow Instagram", "Hanya pada tampilan Detail per orang.", "proofs", o.view !== "detail")}
        {sw("Nomor WhatsApp dan email", "Matikan bila laporan akan dibagikan ke pihak luar.", "contact")}
        {sw("Catatan internal pengurus", "Catatan yang kamu tulis di kolom catatan pendaftar.", "notes")}
        {sw("Kolom pengesahan", "Tempat tanda tangan Ketua Umum dan Sekretaris di akhir laporan.", "sign")}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={ready ? href : undefined} target="_blank" rel="noreferrer" aria-disabled={!ready} className="ad-btn ad-btn-primary ad-btn-lg">
          <FileDown size={18} /> Buat laporan pendaftar
        </a>
        <p className="text-[14px] text-[var(--ad-mute)]">
          <b className="font-semibold text-[var(--ad-ink)] tnum">{matched.length}</b> dari {rows.length} pendaftar sesuai pilihanmu.
        </p>
      </div>
    </div>
  );
}
