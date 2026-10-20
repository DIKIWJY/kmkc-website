"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { saveSettings } from "@/lib/admin/actions";
import ImageField from "./ImageField";
import { useToast } from "./Toast";
import type { SiteSettings, StatItem, Founder, TimelineItem } from "@/lib/types";

const input = "w-full px-3.5 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition";

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl ring-1 ring-border p-6">
      <h2 className="font-bold text-primary-dark">{title}</h2>
      {desc && <p className="text-sm text-neutral-400 mt-0.5 mb-5">{desc}</p>}
      <div className={`grid sm:grid-cols-2 gap-x-4 gap-y-4 ${desc ? "" : "mt-5"}`}>{children}</div>
    </section>
  );
}

function F({ label, full, help, children }: { label: string; full?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
      {help && <p className="text-xs text-neutral-400 mt-1.5">{help}</p>}
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
    <form onSubmit={submit} className="space-y-6 max-w-4xl pb-24">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Pengaturan Website</h1>
        <p className="text-neutral-500 text-sm mt-1">Semua teks utama di halaman depan diatur dari sini.</p>
      </div>

      <Card title="Identitas">
        <F label="Nama singkat *"><input className={input} value={s.name} maxLength={40} onChange={(e) => set("name", e.target.value)} required /></F>
        <F label="Nama lengkap"><input className={input} value={s.full_name} maxLength={150} onChange={(e) => set("full_name", e.target.value)} /></F>
        <F label="Tagline (di halaman paling atas)" full><textarea rows={2} className={input} value={s.tagline} maxLength={300} onChange={(e) => set("tagline", e.target.value)} /></F>
      </Card>

      <Card title="Siapa Kami" desc="Pisahkan paragraf dengan baris kosong. Bungkus kata dengan **dua bintang** agar tampil tebal.">
        <F label="Foto kebersamaan pengurus" full help="Tampil di samping teks bagian “Siapa Kami”. Rasio 3:2 paling pas."><ImageField value={s.about_photo} onChange={(v) => set("about_photo", v)} folder="site" maxSize={1600} /></F>
        <F label="Deskripsi organisasi" full><textarea rows={8} className={input} value={s.about} maxLength={3000} onChange={(e) => set("about", e.target.value)} /></F>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Angka ringkas di halaman depan (maks 4)</label>
          <div className="space-y-2">
            {s.stats.map((st, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${input} w-28`} placeholder="100+" value={st.value} maxLength={12} onChange={(e) => setStat(i, "value", e.target.value)} />
                <input className={input} placeholder="Anggota" value={st.label} maxLength={24} onChange={(e) => setStat(i, "label", e.target.value)} />
                <button type="button" onClick={() => set("stats", s.stats.filter((_, x) => x !== i))} className="w-11 shrink-0 rounded-xl ring-1 ring-border text-neutral-400 hover:text-red-500 flex items-center justify-center" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.stats.length < 4 && (
            <button type="button" onClick={() => set("stats", [...s.stats, { value: "", label: "" }])} className="mt-2 text-sm font-medium text-accent inline-flex items-center gap-1"><Plus size={15} /> Tambah angka</button>
          )}
        </div>
      </Card>

      <Card title="History of KMKC" desc="Tiga bagian: pembuka singkat, linimasa perjalanan, dan daftar penggagas. **dua bintang** = tebal.">
        <F label="Pembuka singkat" full help="Tampil di kartu besar paling atas. Pisahkan paragraf dengan baris kosong."><textarea rows={5} className={input} value={s.history} maxLength={5000} onChange={(e) => set("history", e.target.value)} /></F>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Linimasa perjalanan (maks 30)</label>
          <div className="space-y-3">
            {s.timeline.map((t, i) => (
              <div key={i} className="rounded-xl ring-1 ring-border bg-surface/50 p-3.5 flex gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-1">{i + 1}</span>
                <div className="flex-1 grid sm:grid-cols-[11rem_1fr] gap-2.5">
                  <input className={input} placeholder="27 Januari 2008" aria-label="Tanggal" value={t.date} maxLength={40} onChange={(e) => setTimeline(i, "date", e.target.value)} />
                  <input className={input} placeholder="Judul peristiwa" aria-label="Judul" value={t.title} maxLength={120} onChange={(e) => setTimeline(i, "title", e.target.value)} />
                  <textarea rows={2} className={`${input} sm:col-span-2`} placeholder="Ceritakan singkat apa yang terjadi" aria-label="Uraian" value={t.desc} maxLength={600} onChange={(e) => setTimeline(i, "desc", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button type="button" onClick={() => moveTimeline(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-lg ring-1 ring-border bg-white text-neutral-500 hover:text-primary disabled:opacity-30 flex items-center justify-center" aria-label="Naikkan"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveTimeline(i, 1)} disabled={i === s.timeline.length - 1} className="w-8 h-8 rounded-lg ring-1 ring-border bg-white text-neutral-500 hover:text-primary disabled:opacity-30 flex items-center justify-center" aria-label="Turunkan"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => set("timeline", s.timeline.filter((_, x) => x !== i))} className="w-8 h-8 rounded-lg ring-1 ring-border bg-white text-neutral-400 hover:text-red-500 flex items-center justify-center" aria-label="Hapus peristiwa"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          {s.timeline.length < 30 && (
            <button type="button" onClick={() => set("timeline", [...s.timeline, { date: "", title: "", desc: "" }])} className="mt-2 text-sm font-medium text-accent inline-flex items-center gap-1"><Plus size={15} /> Tambah peristiwa</button>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Pendiri / penggagas (maks 20)</label>
          <div className="space-y-2">
            {s.founders.map((f, i) => (
              <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2">
                <span className="w-8 h-10 shrink-0 flex items-center justify-center text-xs font-bold text-primary/50">{i + 1}</span>
                <input className={input} placeholder="Nama" aria-label="Nama" value={f.name} maxLength={80} onChange={(e) => setFounder(i, "name", e.target.value)} />
                <input className={`${input} sm:w-44`} placeholder="Kampus / fakultas" aria-label="Kampus" value={f.campus} maxLength={80} onChange={(e) => setFounder(i, "campus", e.target.value)} />
                <input className={`${input} sm:w-56`} placeholder="Peran (opsional)" aria-label="Peran" value={f.role ?? ""} maxLength={60} onChange={(e) => setFounder(i, "role", e.target.value)} />
                <button type="button" onClick={() => set("founders", s.founders.filter((_, x) => x !== i))} className="w-11 shrink-0 rounded-xl ring-1 ring-border text-neutral-400 hover:text-red-500 flex items-center justify-center" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.founders.length < 20 && (
            <button type="button" onClick={() => set("founders", [...s.founders, { name: "", campus: "", role: "" }])} className="mt-2 text-sm font-medium text-accent inline-flex items-center gap-1"><Plus size={15} /> Tambah pendiri</button>
          )}
        </div>
      </Card>

      <Card title="Visi & Misi">
        <F label="Visi" full><textarea rows={3} className={input} value={s.vision} maxLength={800} onChange={(e) => set("vision", e.target.value)} /></F>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Misi (maks 12 poin)</label>
          <div className="space-y-2">
            {s.mission.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-8 h-10 shrink-0 flex items-center justify-center text-xs font-bold text-primary/50">{i + 1}</span>
                <textarea rows={2} className={input} value={m} maxLength={300} onChange={(e) => setMission(i, e.target.value)} />
                <button type="button" onClick={() => set("mission", s.mission.filter((_, x) => x !== i))} className="w-11 shrink-0 rounded-xl ring-1 ring-border text-neutral-400 hover:text-red-500 flex items-center justify-center self-start h-10" aria-label="Hapus"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {s.mission.length < 12 && (
            <button type="button" onClick={() => set("mission", [...s.mission, ""])} className="mt-2 text-sm font-medium text-accent inline-flex items-center gap-1"><Plus size={15} /> Tambah misi</button>
          )}
        </div>
      </Card>

      <Card title="Kontak & media sosial">
        <F label="Email"><input type="email" className={input} value={s.email} onChange={(e) => set("email", e.target.value)} /></F>
        <F label="Nomor WhatsApp" help="Contoh: 0812xxxx — otomatis jadi tautan wa.me"><input className={input} value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="081234567890" /></F>
        <F label="Telepon (tampilan)"><input className={input} value={s.phone} onChange={(e) => set("phone", e.target.value)} /></F>
        <F label="Alamat sekretariat"><input className={input} value={s.address} onChange={(e) => set("address", e.target.value)} /></F>
        <F label="Instagram (URL)"><input className={input} value={s.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/kmkc" /></F>
        <F label="TikTok (URL)"><input className={input} value={s.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@kmkc" /></F>
        <F label="YouTube (URL)"><input className={input} value={s.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/@kmkc" /></F>
      </Card>

      {children}

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/90 backdrop-blur border-t border-border px-4 lg:px-8 py-3 flex items-center justify-end gap-4 z-30">
        {error && <span className="text-sm text-red-600 mr-auto truncate">{error}</span>}
        <button disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-gradient text-white shadow-md shadow-blue-500/25 inline-flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan perubahan
        </button>
      </div>
    </form>
  );
}
