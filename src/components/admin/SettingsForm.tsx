"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { saveSettings } from "@/lib/admin/actions";
import ImageField from "./ImageField";
import { useToast } from "./Toast";
import { PageHeader } from "./ui";
import { rupiah, parseRupiah } from "@/lib/money";
import type { SiteSettings, StatItem, Founder, TimelineItem } from "@/lib/types";

const input = "ad-input";

function Group({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 px-1">
        <h2 className="ad-h2">{title}</h2>
        {desc && <p className="mt-0.5 text-[13px] text-[var(--ad-mute)]">{desc}</p>}
      </div>
      <div className="ad-card grid gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
    </section>
  );
}

function F({ label, full, help, children }: { label: string; full?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="ad-label">{label}</label>
      {children}
      {help && <p className="ad-help">{help}</p>}
    </div>
  );
}

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
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8 pb-24">
      <PageHeader title="Pengaturan" subtitle="Semua teks utama website diatur dari sini. Perubahan langsung tampil di website setelah disimpan." />

      <Group title="Identitas">
        <F label="Nama singkat *"><input className={input} value={s.name} maxLength={40} onChange={(e) => set("name", e.target.value)} required /></F>
        <F label="Nama lengkap"><input className={input} value={s.full_name} maxLength={150} onChange={(e) => set("full_name", e.target.value)} /></F>
        <F label="Tagline (di halaman paling atas)" full><textarea rows={2} className={input} value={s.tagline} maxLength={300} onChange={(e) => set("tagline", e.target.value)} /></F>
      </Group>

      <Group title="Siapa Kami" desc="Pisahkan paragraf dengan baris kosong. Bungkus kata dengan **dua bintang** agar tampil tebal.">
        <F label="Foto kebersamaan pengurus" full help="Tampil di samping teks bagian “Siapa Kami”. Rasio 3:2 paling pas."><ImageField value={s.about_photo} onChange={(v) => set("about_photo", v)} folder="site" maxSize={1600} /></F>
        <F label="Deskripsi organisasi" full><textarea rows={8} className={input} value={s.about} maxLength={3000} onChange={(e) => set("about", e.target.value)} /></F>
        <div className="sm:col-span-2">
          <label className="ad-label">Angka ringkas di halaman depan (maks 4)</label>
          <div className="space-y-2">
            {s.stats.map((st, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${input} w-28`} placeholder="100+" value={st.value} maxLength={12} onChange={(e) => setStat(i, "value", e.target.value)} />
                <input className={input} placeholder="Anggota" value={st.label} maxLength={24} onChange={(e) => setStat(i, "label", e.target.value)} />
                <button type="button" onClick={() => set("stats", s.stats.filter((_, x) => x !== i))} className="ad-icon-btn danger !h-[42px] !w-10 !rounded-[10px] shrink-0" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.stats.length < 4 && (
            <button type="button" onClick={() => set("stats", [...s.stats, { value: "", label: "" }])} className="ad-btn ad-btn-plain ad-btn-sm mt-2 -ml-2"><Plus size={15} /> Tambah angka</button>
          )}
        </div>
      </Group>

      <Group title="History of KMKC" desc="Tiga bagian: pembuka singkat, linimasa perjalanan, dan daftar penggagas. **dua bintang** = tebal.">
        <F label="Pembuka singkat" full help="Tampil di kartu besar paling atas. Pisahkan paragraf dengan baris kosong."><textarea rows={5} className={input} value={s.history} maxLength={5000} onChange={(e) => set("history", e.target.value)} /></F>

        <div className="sm:col-span-2">
          <label className="ad-label">Linimasa perjalanan (maks 30)</label>
          <div className="space-y-3">
            {s.timeline.map((t, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-[rgba(0,0,0,0.03)] p-3.5">
                <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[var(--ad-mute)] shadow-[0_0_0_1px_var(--ad-line)]">{i + 1}</span>
                <div className="flex-1 grid sm:grid-cols-[11rem_1fr] gap-2.5">
                  <input className={input} placeholder="27 Januari 2008" aria-label="Tanggal" value={t.date} maxLength={40} onChange={(e) => setTimeline(i, "date", e.target.value)} />
                  <input className={input} placeholder="Judul peristiwa" aria-label="Judul" value={t.title} maxLength={120} onChange={(e) => setTimeline(i, "title", e.target.value)} />
                  <textarea rows={2} className={`${input} sm:col-span-2`} placeholder="Ceritakan singkat apa yang terjadi" aria-label="Uraian" value={t.desc} maxLength={600} onChange={(e) => setTimeline(i, "desc", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button type="button" onClick={() => moveTimeline(i, -1)} disabled={i === 0} className="ad-icon-btn" aria-label="Naikkan"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveTimeline(i, 1)} disabled={i === s.timeline.length - 1} className="ad-icon-btn" aria-label="Turunkan"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => set("timeline", s.timeline.filter((_, x) => x !== i))} className="ad-icon-btn danger" aria-label="Hapus peristiwa"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          {s.timeline.length < 30 && (
            <button type="button" onClick={() => set("timeline", [...s.timeline, { date: "", title: "", desc: "" }])} className="ad-btn ad-btn-plain ad-btn-sm mt-2 -ml-2"><Plus size={15} /> Tambah peristiwa</button>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="ad-label">Pendiri / penggagas (maks 20)</label>
          <div className="space-y-2">
            {s.founders.map((f, i) => (
              <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2">
                <span className="flex h-[42px] w-6 shrink-0 items-center justify-center text-[13px] font-medium text-[var(--ad-faint)] tnum">{i + 1}</span>
                <input className={input} placeholder="Nama" aria-label="Nama" value={f.name} maxLength={80} onChange={(e) => setFounder(i, "name", e.target.value)} />
                <input className={`${input} sm:w-44`} placeholder="Kampus / fakultas" aria-label="Kampus" value={f.campus} maxLength={80} onChange={(e) => setFounder(i, "campus", e.target.value)} />
                <input className={`${input} sm:w-56`} placeholder="Peran (opsional)" aria-label="Peran" value={f.role ?? ""} maxLength={60} onChange={(e) => setFounder(i, "role", e.target.value)} />
                <button type="button" onClick={() => set("founders", s.founders.filter((_, x) => x !== i))} className="ad-icon-btn danger !h-[42px] !w-10 !rounded-[10px] shrink-0" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.founders.length < 20 && (
            <button type="button" onClick={() => set("founders", [...s.founders, { name: "", campus: "", role: "" }])} className="ad-btn ad-btn-plain ad-btn-sm mt-2 -ml-2"><Plus size={15} /> Tambah pendiri</button>
          )}
        </div>
      </Group>

      <Group title="Visi & Misi">
        <F label="Visi" full><textarea rows={3} className={input} value={s.vision} maxLength={800} onChange={(e) => set("vision", e.target.value)} /></F>
        <div className="sm:col-span-2">
          <label className="ad-label">Misi (maks 12 poin)</label>
          <div className="space-y-2">
            {s.mission.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex h-[42px] w-6 shrink-0 items-center justify-center text-[13px] font-medium text-[var(--ad-faint)] tnum">{i + 1}</span>
                <textarea rows={2} className={input} value={m} maxLength={300} onChange={(e) => setMission(i, e.target.value)} />
                <button type="button" onClick={() => set("mission", s.mission.filter((_, x) => x !== i))} className="ad-icon-btn danger !h-[42px] !w-10 !rounded-[10px] shrink-0" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.mission.length < 12 && (
            <button type="button" onClick={() => set("mission", [...s.mission, ""])} className="ad-btn ad-btn-plain ad-btn-sm mt-2 -ml-2"><Plus size={15} /> Tambah misi</button>
          )}
        </div>
      </Group>

      <Group title="Kontak & media sosial">
        <F label="Email"><input type="email" className={input} value={s.email} onChange={(e) => set("email", e.target.value)} /></F>
        <F label="Nomor WhatsApp" help="Nomor (0812xxxx, otomatis jadi tautan wa.me) atau tautan wa.me langsung, misalnya dari QR WhatsApp."><input className={input} value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="081234567890 atau https://wa.me/…" /></F>
        <F label="Telepon (tampilan)"><input className={input} value={s.phone} onChange={(e) => set("phone", e.target.value)} /></F>
        <F label="Alamat sekretariat"><input className={input} value={s.address} onChange={(e) => set("address", e.target.value)} /></F>
        <F label="Instagram (URL)" help="Juga dipakai sebagai tautan “Follow” di formulir pendaftaran."><input className={input} value={s.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/kmkc" /></F>
        <F label="TikTok (URL)"><input className={input} value={s.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@kmkc" /></F>
        <F label="YouTube (URL)"><input className={input} value={s.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/@kmkc" /></F>
      </Group>

      <Group title="Pendaftaran anggota" desc="Atur apakah /daftar menerima pendaftar, dan formulir mana yang dipakai.">
        <div className="flex items-center justify-between gap-4 sm:col-span-2">
          <div>
            <p className="text-[15px] font-medium">Pendaftaran dibuka</p>
            <p className="ad-help !mt-0.5">Bila ditutup, halaman /daftar menampilkan pemberitahuan dan tidak ada formulir.</p>
          </div>
          <button
            type="button" role="switch" aria-checked={s.registration_open} aria-label="Pendaftaran dibuka"
            onClick={() => set("registration_open", !s.registration_open)} className="ad-switch"
          />
        </div>
        <F label="Formulir yang dipakai" full>
          <div className="ad-seg" role="group" aria-label="Mode formulir">
            <button type="button" aria-pressed={s.registration_mode === "builtin"} onClick={() => set("registration_mode", "builtin")}>Formulir bawaan website</button>
            <button type="button" aria-pressed={s.registration_mode === "gform"} onClick={() => set("registration_mode", "gform")}>Google Form</button>
          </div>
          <p className="ad-help">
            {s.registration_mode === "builtin"
              ? "Data masuk ke menu Pendaftar di dashboard ini (lengkap dengan bukti follow Instagram dan, bila ada HTM, bukti pembayaran)."
              : "Pendaftar mengisi Google Form kamu; data tersimpan di Google Sheets, bukan di menu Pendaftar."}
          </p>
        </F>
        {s.registration_mode === "gform" && (
          <F label="Tautan Google Form" full help="Salin dari Google Form → Kirim → ikon tautan. Mendukung docs.google.com/forms/… dan forms.gle/…">
            <input className={input} value={s.gform_url} onChange={(e) => set("gform_url", e.target.value)} placeholder="https://docs.google.com/forms/d/e/…/viewform" inputMode="url" />
          </F>
        )}
        {s.registration_mode === "builtin" && (
          <>
            <F label="HTM / biaya pendaftaran (Rp)" help={s.registration_fee > 0 ? `Tampil di /daftar sebagai ${rupiah(s.registration_fee)}. Pendaftar wajib mengunggah bukti pembayaran.` : "Kosongkan atau isi 0 bila tidak ada biaya. Bila diisi, formulir meminta bukti pembayaran."}>
              <input
                className={input} inputMode="numeric" placeholder="Contoh: 25000" maxLength={11}
                value={s.registration_fee ? String(s.registration_fee) : ""}
                onChange={(e) => set("registration_fee", parseRupiah(e.target.value))}
              />
            </F>
            <F label="Petunjuk pembayaran" help="Nomor rekening / e-wallet beserta nama pemilik, satu per baris. Tampil di formulir bila ada HTM.">
              <textarea rows={3} className={input} maxLength={600} value={s.payment_info} onChange={(e) => set("payment_info", e.target.value)} placeholder={"BRI 1234 5678 9012 a.n. Nama Bendahara\nDANA 0812 3456 7890 a.n. Nama Bendahara"} />
            </F>
            <F label="Gambar QRIS (opsional)" full help="Unggah QRIS organisasi agar pendaftar bisa membayar dengan memindai. Tampil di formulir bila ada HTM.">
              <ImageField value={s.payment_qr} onChange={(v) => set("payment_qr", v)} folder="site" maxSize={1000} />
            </F>
          </>
        )}
        <F label="Catatan pendaftaran" full help="Tampil di halaman /daftar, misalnya jadwal buka atau syarat. Saat ditutup, catatan ini menjadi penjelasan utama.">
          <textarea rows={2} className={input} maxLength={300} value={s.registration_note} onChange={(e) => set("registration_note", e.target.value)} placeholder="Contoh: Pendaftaran anggota baru dibuka 1–30 September." />
        </F>
      </Group>

      {children}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--ad-line)] bg-[rgba(245,245,247,0.86)] backdrop-blur-xl lg:left-[248px]">
        <div className="mx-auto flex max-w-[1160px] items-center justify-end gap-4 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10">
          {error && <span role="alert" className="mr-auto truncate text-[14px] text-[var(--ad-red)]">{error}</span>}
          <button disabled={saving} className="ad-btn ad-btn-primary min-w-[150px]">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan perubahan
          </button>
        </div>
      </div>
    </form>
  );
}
