"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { defaultRegOptions, matchReg, regQuery, type RegLite, type RegOptions, type RegGroup, type RegSort } from "@/lib/admin/registrant-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "./ui";
import { Seg, SwitchRow } from "./report-controls";

interface Props {
  rows: RegLite[];
  villages: string[];
  campuses: string[];
  batches: string[];
}

/** Radix Select tidak menerima nilai kosong, jadi pilihan "Semua …" memakai penanda ini. */
const ALL = "__semua__";

/** Penyusun Laporan Pendaftar: saring, kelompokkan, pilih isi, lalu buka laporan siap-PDF. Jumlah hasil dihitung langsung. */
export default function RegistrantReportBuilder({ rows, villages, campuses, batches }: Props) {
  const [o, setO] = useState<RegOptions>(defaultRegOptions());
  const set = <K extends keyof RegOptions>(k: K, v: RegOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  const matched = useMemo(() => rows.filter((r) => matchReg(r, o)), [rows, o]);
  const href = `/admin/arsip/pendaftar?${regQuery({ ...o, auto: true })}`;
  const ready = matched.length > 0;

  const filter = (id: string, label: string, value: string, opts: string[], onChange: (v: string) => void, all: string) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{all}</SelectItem>
          {opts.filter(Boolean).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-5">
      <Card className="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rp-from">Terdaftar dari</Label>
          <Input id="rp-from" type="date" value={o.from} max={o.to || undefined} onChange={(e) => set("from", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-to">Sampai</Label>
          <Input id="rp-to" type="date" value={o.to} min={o.from || undefined} onChange={(e) => set("to", e.target.value)} />
        </div>
        {filter("rp-village", "Desa asal", o.village, villages, (v) => set("village", v), "Semua desa")}
        {filter("rp-campus", "Perguruan tinggi", o.campus, campuses, (v) => set("campus", v), "Semua kampus")}
        {filter("rp-batch", "Angkatan", o.batch, batches, (v) => set("batch", v), "Semua angkatan")}
      </Card>

      <Card className="grid gap-5 p-4 sm:grid-cols-2">
        <Seg label="Tampilan daftar" value={o.view} options={[["rekap", "Rekap tabel"], ["detail", "Detail per orang"]]} onChange={(v) => set("view", v)} />
        <Seg<RegSort> label="Urutkan" value={o.sort} options={[["new", "Terbaru"], ["old", "Terlama"], ["name", "Nama A–Z"]]} onChange={(v) => set("sort", v)} />
        <div className="sm:col-span-2">
          <Seg<RegGroup> label="Kelompokkan menurut" value={o.group} options={[["none", "Tanpa"], ["village", "Desa"], ["campus", "Kampus"], ["batch", "Angkatan"]]} onChange={(v) => set("group", v)} />
        </div>
      </Card>

      <Card className="divide-y">
        <SwitchRow id="rp-stats" label="Ringkasan statistik" desc="Total, per desa, per kampus, per angkatan, dan tren pendaftaran." checked={o.stats} onChange={(v) => set("stats", v)} />
        <SwitchRow id="rp-reason" label="Alasan bergabung" desc="Teks alasan tiap pendaftar ikut tercetak." checked={o.reason} onChange={(v) => set("reason", v)} />
        <SwitchRow id="rp-proofs" label="Gambar bukti follow Instagram" desc="Hanya pada tampilan Detail per orang." checked={o.proofs} disabled={o.view !== "detail"} onChange={(v) => set("proofs", v)} />
        <SwitchRow id="rp-contact" label="Nomor WhatsApp dan email" desc="Matikan bila laporan akan dibagikan ke pihak luar." checked={o.contact} onChange={(v) => set("contact", v)} />
        <SwitchRow id="rp-notes" label="Catatan internal pengurus" desc="Catatan yang kamu tulis di kolom catatan pendaftar." checked={o.notes} onChange={(v) => set("notes", v)} />
        <SwitchRow id="rp-sign" label="Kolom pengesahan" desc="Tempat tanda tangan Ketua Umum dan Sekretaris di akhir laporan." checked={o.sign} onChange={(v) => set("sign", v)} />
      </Card>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {ready ? (
          <Button asChild size="lg"><a href={href} target="_blank" rel="noreferrer"><FileDown /> Buat laporan pendaftar</a></Button>
        ) : (
          <Button size="lg" disabled><FileDown /> Buat laporan pendaftar</Button>
        )}
        <p className="text-sm text-muted-foreground">
          <b className="font-semibold tabular-nums text-foreground">{matched.length}</b> dari {rows.length} pendaftar sesuai pilihanmu.
        </p>
      </div>
    </div>
  );
}
