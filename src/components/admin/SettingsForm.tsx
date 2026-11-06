"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { saveSettings } from "@/lib/admin/actions";
import { rupiah, parseRupiah } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ImageField from "./ImageField";
import { useToast } from "./Toast";
import { PageHeader } from "./ui";
import type { SiteSettings, StatItem, Founder, TimelineItem } from "@/lib/types";

function Group({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

/** Satu kolom isian: label di atas, bantuan di bawah. `id` menyambungkan label dengan isiannya. */
function F({ id, label, full, help, children }: { id?: string; label: React.ReactNode; full?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div className={full ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

const Req = () => <span className="text-destructive" aria-hidden>*</span>;
const delBtn = "size-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive";
const addBtn = "-ml-2 mt-2";
const rowNum = "flex h-9 w-6 shrink-0 items-center justify-center text-[13px] font-medium tabular-nums text-muted-foreground";

export default function SettingsForm({ initial, children }: { initial: SiteSettings; children?: React.ReactNode }) {
  const toast = useToast();
  const [s, setS] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  const setMission = (i: number, v: string) => set("mission", s.mission.map((m, idx) => (idx === i ? v : m)));
  const setFounder = (i: number, k: keyof Founder, v: string) => set("founders", s.founders.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  const setTimeline = (i: number, k: keyof TimelineItem, v: string) => set("timeline", s.timeline.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  const moveTimeline = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= s.timeline.length) return;
    const next = [...s.timeline];
    [next[i], next[j]] = [next[j], next[i]];
    set("timeline", next);
  };
  const setStat = (i: number, k: keyof StatItem, v: string) => set("stats", s.stats.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await saveSettings({ ...s });
    setSaving(false);
    if (!r.ok) {
      setError(r.error);
      return toast("error", r.error);
    }
    toast("success", "Pengaturan disimpan. Website diperbarui.");
  }

  return (
    <form onSubmit={submit} className="space-y-6 pb-2">
      <PageHeader title="Pengaturan" subtitle="Semua teks utama website diatur dari sini. Perubahan langsung tampil di website setelah disimpan." />

      <Group title="Identitas">
        <F id="s-name" label={<>Nama singkat <Req /></>}><Input id="s-name" value={s.name} maxLength={40} onChange={(e) => set("name", e.target.value)} required /></F>
        <F id="s-full" label="Nama lengkap"><Input id="s-full" value={s.full_name} maxLength={150} onChange={(e) => set("full_name", e.target.value)} /></F>
        <F id="s-tag" label="Tagline (di halaman paling atas)" full><Textarea id="s-tag" rows={2} value={s.tagline} maxLength={300} onChange={(e) => set("tagline", e.target.value)} /></F>
      </Group>

      <Group title="Siapa Kami" desc="Pisahkan paragraf dengan baris kosong. Bungkus kata dengan **dua bintang** agar tampil tebal.">
        <F label="Foto kebersamaan pengurus" full help="Tampil di samping teks bagian “Siapa Kami”. Rasio 3:2 paling pas."><ImageField value={s.about_photo} onChange={(v) => set("about_photo", v)} folder="site" maxSize={1600} /></F>
        <F id="s-about" label="Deskripsi organisasi" full><Textarea id="s-about" rows={8} value={s.about} maxLength={3000} onChange={(e) => set("about", e.target.value)} /></F>
        <div className="space-y-2 sm:col-span-2">
          <Label>Angka ringkas di halaman depan (maks 4)</Label>
          <div className="space-y-2">
            {s.stats.map((st, i) => (
              <div key={i} className="flex gap-2">
                <Input className="w-28" placeholder="100+" aria-label="Angka" value={st.value} maxLength={12} onChange={(e) => setStat(i, "value", e.target.value)} />
                <Input placeholder="Anggota" aria-label="Keterangan" value={st.label} maxLength={24} onChange={(e) => setStat(i, "label", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" className={delBtn} onClick={() => set("stats", s.stats.filter((_, x) => x !== i))} aria-label="Hapus"><Trash2 /></Button>
              </div>
            ))}
          </div>
          {s.stats.length < 4 && (
            <Button type="button" variant="ghost" size="sm" className={addBtn} onClick={() => set("stats", [...s.stats, { value: "", label: "" }])}><Plus /> Tambah angka</Button>
          )}
        </div>
      </Group>

      <Group title="History of KMKC" desc="Tiga bagian: pembuka singkat, linimasa perjalanan, dan daftar penggagas. **dua bintang** = tebal.">
        <F id="s-hist" label="Pembuka singkat" full help="Tampil di kartu besar paling atas. Pisahkan paragraf dengan baris kosong."><Textarea id="s-hist" rows={5} value={s.history} maxLength={5000} onChange={(e) => set("history", e.target.value)} /></F>

        <div className="space-y-2 sm:col-span-2">
          <Label>Linimasa perjalanan (maks 30)</Label>
          <div className="space-y-3">
            {s.timeline.map((t, i) => (
              <div key={i} className="flex gap-3 rounded-lg border bg-muted/30 p-3.5">
                <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-[12px] font-semibold text-muted-foreground ring-1 ring-border">{i + 1}</span>
                <div className="grid flex-1 gap-2.5 sm:grid-cols-[11rem_1fr]">
                  <Input placeholder="27 Januari 2008" aria-label="Tanggal" value={t.date} maxLength={40} onChange={(e) => setTimeline(i, "date", e.target.value)} />
                  <Input placeholder="Judul peristiwa" aria-label="Judul" value={t.title} maxLength={120} onChange={(e) => setTimeline(i, "title", e.target.value)} />
                  <Textarea rows={2} className="sm:col-span-2" placeholder="Ceritakan singkat apa yang terjadi" aria-label="Uraian" value={t.desc} maxLength={600} onChange={(e) => setTimeline(i, "desc", e.target.value)} />
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => moveTimeline(i, -1)} disabled={i === 0} aria-label="Naikkan"><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => moveTimeline(i, 1)} disabled={i === s.timeline.length - 1} aria-label="Turunkan"><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => set("timeline", s.timeline.filter((_, x) => x !== i))} aria-label="Hapus peristiwa"><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
          {s.timeline.length < 30 && (
            <Button type="button" variant="ghost" size="sm" className={addBtn} onClick={() => set("timeline", [...s.timeline, { date: "", title: "", desc: "" }])}><Plus /> Tambah peristiwa</Button>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Pendiri / penggagas (maks 20)</Label>
          <div className="space-y-2">
            {s.founders.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                <span className={rowNum}>{i + 1}</span>
                <Input placeholder="Nama" aria-label="Nama" value={f.name} maxLength={80} onChange={(e) => setFounder(i, "name", e.target.value)} />
                <Input className="sm:w-44" placeholder="Kampus / fakultas" aria-label="Kampus" value={f.campus} maxLength={80} onChange={(e) => setFounder(i, "campus", e.target.value)} />
                <Input className="sm:w-56" placeholder="Peran (opsional)" aria-label="Peran" value={f.role ?? ""} maxLength={60} onChange={(e) => setFounder(i, "role", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" className={delBtn} onClick={() => set("founders", s.founders.filter((_, x) => x !== i))} aria-label="Hapus"><Trash2 /></Button>
              </div>
            ))}
          </div>
          {s.founders.length < 20 && (
            <Button type="button" variant="ghost" size="sm" className={addBtn} onClick={() => set("founders", [...s.founders, { name: "", campus: "", role: "" }])}><Plus /> Tambah pendiri</Button>
          )}
        </div>
      </Group>

      <Group title="Visi & Misi">
        <F id="s-vision" label="Visi" full><Textarea id="s-vision" rows={3} value={s.vision} maxLength={800} onChange={(e) => set("vision", e.target.value)} /></F>
        <div className="space-y-2 sm:col-span-2">
          <Label>Misi (maks 12 poin)</Label>
          <div className="space-y-2">
            {s.mission.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className={rowNum}>{i + 1}</span>
                <Textarea rows={2} aria-label={`Misi ${i + 1}`} value={m} maxLength={300} onChange={(e) => setMission(i, e.target.value)} />
                <Button type="button" variant="ghost" size="icon" className={delBtn} onClick={() => set("mission", s.mission.filter((_, x) => x !== i))} aria-label="Hapus"><Trash2 /></Button>
              </div>
            ))}
          </div>
          {s.mission.length < 12 && (
            <Button type="button" variant="ghost" size="sm" className={addBtn} onClick={() => set("mission", [...s.mission, ""])}><Plus /> Tambah misi</Button>
          )}
        </div>
      </Group>

      <Group title="Kontak & media sosial">
        <F id="s-email" label="Email"><Input id="s-email" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} /></F>
        <F id="s-wa" label="Nomor WhatsApp" help="Nomor (0812xxxx, otomatis jadi tautan wa.me) atau tautan wa.me langsung, misalnya dari QR WhatsApp."><Input id="s-wa" value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="081234567890 atau https://wa.me/…" /></F>
        <F id="s-phone" label="Telepon (tampilan)"><Input id="s-phone" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></F>
        <F id="s-addr" label="Alamat sekretariat"><Input id="s-addr" value={s.address} onChange={(e) => set("address", e.target.value)} /></F>
        <F id="s-ig" label="Instagram (URL)" help="Juga dipakai sebagai tautan “Follow” di formulir pendaftaran."><Input id="s-ig" value={s.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/kmkc" /></F>
        <F id="s-tt" label="TikTok (URL)"><Input id="s-tt" value={s.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@kmkc" /></F>
        <F id="s-yt" label="YouTube (URL)"><Input id="s-yt" value={s.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/@kmkc" /></F>
      </Group>

      <Group title="Pendaftaran anggota" desc="Atur apakah /daftar menerima pendaftar, dan formulir mana yang dipakai.">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 sm:col-span-2">
          <div>
            <Label htmlFor="s-open" className="text-sm font-medium">Pendaftaran dibuka</Label>
            <p className="mt-1 text-xs text-muted-foreground">Bila ditutup, halaman /daftar menampilkan pemberitahuan dan tidak ada formulir.</p>
          </div>
          <Switch id="s-open" checked={s.registration_open} onCheckedChange={(v) => set("registration_open", v)} />
        </div>
        <F label="Formulir yang dipakai" full>
          <Tabs value={s.registration_mode} onValueChange={(v) => set("registration_mode", v as SiteSettings["registration_mode"])}>
            <TabsList aria-label="Mode formulir">
              <TabsTrigger value="builtin" className="px-3">Formulir bawaan website</TabsTrigger>
              <TabsTrigger value="gform" className="px-3">Google Form</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {s.registration_mode === "builtin"
              ? "Data masuk ke menu Pendaftar di dashboard ini (lengkap dengan bukti follow Instagram dan, bila ada HTM, bukti pembayaran)."
              : "Pendaftar mengisi Google Form kamu; data tersimpan di Google Sheets, bukan di menu Pendaftar."}
          </p>
        </F>
        {s.registration_mode === "gform" && (
          <F id="s-gform" label="Tautan Google Form" full help="Salin dari Google Form → Kirim → ikon tautan. Mendukung docs.google.com/forms/… dan forms.gle/…">
            <Input id="s-gform" value={s.gform_url} onChange={(e) => set("gform_url", e.target.value)} placeholder="https://docs.google.com/forms/d/e/…/viewform" inputMode="url" />
          </F>
        )}
        {s.registration_mode === "builtin" && (
          <>
            <F id="s-fee" label="HTM / biaya pendaftaran (Rp)" help={s.registration_fee > 0 ? `Tampil di /daftar sebagai ${rupiah(s.registration_fee)}. Pendaftar wajib mengunggah bukti pembayaran.` : "Kosongkan atau isi 0 bila tidak ada biaya. Bila diisi, formulir meminta bukti pembayaran."}>
              <Input
                id="s-fee" inputMode="numeric" placeholder="Contoh: 25000" maxLength={11}
                value={s.registration_fee ? String(s.registration_fee) : ""}
                onChange={(e) => set("registration_fee", parseRupiah(e.target.value))}
              />
            </F>
            <F id="s-pay" label="Petunjuk pembayaran" help="Nomor rekening / e-wallet beserta nama pemilik, satu per baris. Tampil di formulir bila ada HTM.">
              <Textarea id="s-pay" rows={3} maxLength={600} value={s.payment_info} onChange={(e) => set("payment_info", e.target.value)} placeholder={"BRI 1234 5678 9012 a.n. Nama Bendahara\nDANA 0812 3456 7890 a.n. Nama Bendahara"} />
            </F>
            <F label="Gambar QRIS (opsional)" full help="Unggah QRIS organisasi agar pendaftar bisa membayar dengan memindai. Tampil di formulir bila ada HTM.">
              <ImageField value={s.payment_qr} onChange={(v) => set("payment_qr", v)} folder="site" maxSize={1000} />
            </F>
          </>
        )}
        <F id="s-note" label="Catatan pendaftaran" full help="Tampil di halaman /daftar, misalnya jadwal buka atau syarat. Saat ditutup, catatan ini menjadi penjelasan utama.">
          <Textarea id="s-note" rows={2} maxLength={300} value={s.registration_note} onChange={(e) => set("registration_note", e.target.value)} placeholder="Contoh: Pendaftaran anggota baru dibuka 1–30 September." />
        </F>
      </Group>

      {children}

      {/* Bilah simpan menempel di tepi bawah layar selama formulir masih terlihat; lebarnya mengikuti konten, jadi aman saat sidebar dilipat. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-end gap-4">
          {error && <span role="alert" className="mr-auto truncate text-sm text-destructive">{error}</span>}
          <Button type="submit" disabled={saving} className="min-w-40">
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan perubahan
          </Button>
        </div>
      </div>
    </form>
  );
}
