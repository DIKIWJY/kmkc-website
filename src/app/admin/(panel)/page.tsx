import Link from "next/link";
import { Users, Images, FileText, Briefcase, CalendarDays, Inbox, CheckCircle2, Circle, Plus, UserPlus, Eye, Info } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { todayWIB } from "@/lib/date";
import { getStats } from "@/lib/admin/stats";
import TrafficPanel from "@/components/admin/charts/TrafficPanel";
import Donut from "@/components/admin/charts/Donut";
import HBars from "@/components/admin/charts/HBars";
import Sparkline from "@/components/admin/charts/Sparkline";
import type { ContactMessage, AuditEntry, SiteSettings } from "@/lib/types";

const nf = new Intl.NumberFormat("id-ID");
const DEVICE: Record<string, { label: string; color: string }> = {
  mobile: { label: "HP", color: "#1e6fd9" },
  desktop: { label: "Komputer", color: "#0f2a5c" },
  tablet: { label: "Tablet", color: "#22d3ee" },
};
const SOURCE: Record<string, string> = { langsung: "Langsung / tautan", instagram: "Instagram", whatsapp: "WhatsApp", google: "Google", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", lainnya: "Situs lain" };
const pageLabel = (p: string) => (p === "/" ? "Beranda" : p === "/berita" ? "Daftar berita" : p === "/daftar" ? "Pendaftaran anggota" : p.startsWith("/berita/") ? `Berita · ${p.slice(8).replace(/-/g, " ")}` : p);

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};

export default async function Dashboard() {
  const { supabase, email } = await requireAdmin();
  const count = (t: string) => supabase.from(t).select("id", { count: "exact", head: true });
  // Komponen server yang dirender per-request (halaman admin dinamis), jadi Date.now() di sini aman.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [members, programs, gallery, events, articles, drafts, msgs, unread, recent, series, audit, settings, regsNew, stats, regsRecent] = await Promise.all([
    count("members"), count("programs"), count("gallery"), count("events").gte("event_date", todayWIB()), count("articles").eq("published", true),
    count("articles").eq("published", false), count("contact_messages"), count("contact_messages").eq("is_read", false),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("contact_messages").select("created_at").gte("created_at", since.toISOString()),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    count("registrations").eq("status", "baru"),
    getStats(supabase),
    supabase.from("registrations").select("id,full_name,campus,village,status,created_at").order("created_at", { ascending: false }).limit(3),
  ]);
  const last30 = stats.daily.slice(-30);
  const sum30 = (k: "views" | "visitors") => last30.reduce((a, d) => a + d[k], 0);
  const today = stats.daily.at(-1);

  // pesan per hari (14 hari)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    return { key: d.toISOString().slice(0, 10), label: d.getDate(), n: 0 };
  });
  for (const r of (series.data ?? []) as { created_at: string }[]) {
    const k = new Date(r.created_at).toISOString().slice(0, 10);
    const d = days.find((x) => x.key === k);
    if (d) d.n++;
  }
  const max = Math.max(1, ...days.map((d) => d.n));

  const s = (settings.data ?? {}) as Partial<SiteSettings>;
  const checklist = [
    { ok: !!s.tagline, label: "Tagline organisasi terisi", href: "/admin/settings" },
    { ok: !!s.about_photo, label: "Foto kebersamaan (bagian Siapa Kami) diunggah", href: "/admin/settings" },
    { ok: (members.count ?? 0) >= 4, label: "Minimal 4 pengurus ditambahkan", href: "/admin/kepengurusan" },
    { ok: (gallery.count ?? 0) >= 6, label: "Minimal 6 foto galeri", href: "/admin/gallery" },
    { ok: !!(s.instagram || s.whatsapp), label: "Instagram / WhatsApp dihubungkan", href: "/admin/settings" },
    { ok: (articles.count ?? 0) >= 1, label: "Minimal 1 berita terbit", href: "/admin/berita" },
    { ok: (events.count ?? 0) >= 1, label: "Ada agenda kegiatan mendatang", href: "/admin/agenda" },
  ];
  const done = checklist.filter((c) => c.ok).length;


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">Selamat datang, {email.split("@")[0]}. Ini ringkasan website KMKC.</p>
      </div>

      {!stats.ok && (
        <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-900">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p><b>Statistik pengunjung belum aktif.</b> Jalankan ulang <code className="bg-white/80 px-1 rounded">supabase/schema.sql</code> di SQL Editor (aman diulang) — grafik akan terisi otomatis begitu ada pengunjung.</p>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Tampilan · 30 hari", v: sum30("views"), hint: today ? `${nf.format(today.views)} hari ini` : "", icon: Eye, spark: last30.map((d) => d.views), href: undefined },
          { label: "Pengunjung · 30 hari", v: sum30("visitors"), hint: today ? `${nf.format(today.visitors)} hari ini` : "", icon: Users, spark: last30.map((d) => d.visitors), href: undefined },
          { label: "Pesan belum dibaca", v: unread.count ?? 0, hint: `${msgs.count ?? 0} pesan total`, icon: Inbox, spark: null, href: "/admin/pesan" },
          { label: "Pendaftar baru", v: regsNew.count ?? 0, hint: "menunggu ditindaklanjuti", icon: UserPlus, spark: null, href: "/admin/pendaftar" },
        ].map(({ label, v, hint, icon: Icon, spark, href }) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                <Icon size={16} />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-primary-dark tabular-nums">{nf.format(v)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>
              {spark && <Sparkline values={spark} className="text-accent mt-3" />}
            </>
          );
          const cls = "block bg-white rounded-2xl ring-1 ring-border p-5";
          return href ? (
            <Link key={label} href={href} className={`${cls} hover:ring-accent/40 hover:shadow-lg hover:shadow-blue-500/10 transition`}>{body}</Link>
          ) : (
            <div key={label} className={cls}>{body}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="min-w-0 lg:col-span-2 bg-white rounded-2xl ring-1 ring-border p-5 sm:p-6">
          <h2 className="font-bold text-primary-dark mb-5">Lalu lintas website</h2>
          <TrafficPanel daily={stats.daily.length ? stats.daily : []} />
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-border p-5 sm:p-6 flex flex-col gap-8">
          <div>
            <h2 className="font-bold text-primary-dark mb-5">Perangkat <span className="text-neutral-400 font-normal text-sm">· 30 hari</span></h2>
            <Donut
              centerLabel="tampilan"
              items={stats.devices.map((d) => ({ label: DEVICE[d.key]?.label ?? d.key, value: d.views, color: DEVICE[d.key]?.color ?? "#94a3b8" }))}
            />
          </div>
          <div>
            <h2 className="font-bold text-primary-dark mb-5">Sumber kunjungan <span className="text-neutral-400 font-normal text-sm">· 30 hari</span></h2>
            <HBars items={stats.sources.slice(0, 5).map((d) => ({ label: SOURCE[d.key] ?? d.key, value: d.views }))} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl ring-1 ring-border p-5 sm:p-6">
          <h2 className="font-bold text-primary-dark mb-5">Halaman terpopuler <span className="text-neutral-400 font-normal text-sm">· 30 hari</span></h2>
          <HBars items={stats.pages.slice(0, 6).map((d) => ({ label: pageLabel(d.key), value: d.views }))} empty="Belum ada kunjungan tercatat." />
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-border p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-bold text-primary-dark mb-5">Isi website</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { label: "Pengurus", v: members.count, icon: Users, href: "/admin/kepengurusan" },
              { label: "Program kerja", v: programs.count, icon: Briefcase, href: "/admin/program" },
              { label: "Agenda", v: events.count, icon: CalendarDays, href: "/admin/agenda" },
              { label: "Foto galeri", v: gallery.count, icon: Images, href: "/admin/gallery" },
              { label: "Berita terbit", v: articles.count, sub: drafts.count ? `${drafts.count} draft` : undefined, icon: FileText, href: "/admin/berita" },
            ].map(({ label, v, sub, icon: Icon, href }) => (
              <Link key={label} href={href} className="group rounded-xl bg-surface hover:bg-surface-alt transition px-4 py-4">
                <Icon size={18} className="text-accent" />
                <p className="mt-3 text-2xl font-extrabold text-primary-dark tabular-nums">{v ?? 0}</p>
                <p className="text-xs text-neutral-500 leading-tight">{label}{sub && <span className="text-amber-600"> · {sub}</span>}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary-dark">Pendaftar terbaru</h3>
              <Link href="/admin/pendaftar" className="text-sm text-accent font-medium hover:underline">Lihat semua</Link>
            </div>
            {((regsRecent.data ?? []) as { id: string; full_name: string; campus: string; village: string; status: string; created_at: string }[]).length === 0 ? (
              <p className="text-sm text-neutral-400 py-3">Belum ada pendaftar. Bagikan tautan <b>/daftar</b> ke calon anggota.</p>
            ) : (
              <ul className="divide-y divide-border">
                {((regsRecent.data ?? []) as { id: string; full_name: string; campus: string; village: string; status: string; created_at: string }[]).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="font-semibold text-neutral-800 truncate">{r.full_name}</span>
                    <span className="text-neutral-400 truncate hidden sm:block flex-1">{[r.campus, r.village].filter(Boolean).join(" · ")}</span>
                    <span className="flex-1 sm:hidden" />
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">{ago(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* pesan chart */}
        <div className="min-w-0 lg:col-span-2 bg-white rounded-2xl ring-1 ring-border p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-bold text-primary-dark">Pesan masuk · 14 hari terakhir</h2>
              <p className="text-sm text-neutral-400">{msgs.count ?? 0} total · {unread.count ?? 0} belum dibaca</p>
            </div>
            <Link href="/admin/pesan" className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"><Inbox size={15} /> Buka inbox</Link>
          </div>
          <div className="flex items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full h-28 flex items-end">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent-light transition-all group-hover:opacity-80" style={{ height: `${Math.max(d.n ? 10 : 4, Math.round((d.n / max) * 112))}px`, opacity: d.n ? 1 : 0.18 }} title={`${d.n} pesan`} />
                </div>
                <span className="text-[10px] text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* checklist */}
        <div className="bg-white rounded-2xl ring-1 ring-border p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-primary-dark">Kelengkapan website</h2>
            <span className="text-sm font-bold text-accent">{done}/{checklist.length}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-alt overflow-hidden mb-4">
            <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <ul className="space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-start gap-2.5 text-sm group">
                  {c.ok ? <CheckCircle2 size={17} className="text-sky-500 shrink-0 mt-0.5" /> : <Circle size={17} className="text-neutral-300 shrink-0 mt-0.5" />}
                  <span className={c.ok ? "text-neutral-400 line-through" : "text-neutral-700 group-hover:text-accent"}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl ring-1 ring-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-primary-dark">Pesan terbaru</h2>
            <Link href="/admin/pesan" className="text-sm text-accent font-medium hover:underline">Lihat semua</Link>
          </div>
          {((recent.data ?? []) as ContactMessage[]).length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">Belum ada pesan.</p>
          ) : (
            <ul className="divide-y divide-border">
              {((recent.data ?? []) as ContactMessage[]).map((m) => (
                <li key={m.id}>
                  <Link href="/admin/pesan" className="flex items-center gap-3 py-3 hover:bg-surface/60 -mx-2 px-2 rounded-xl">
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">{m.name[0]?.toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${m.is_read ? "text-neutral-600" : "font-bold text-neutral-900"}`}>{m.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{m.subject || m.message}</p>
                    </div>
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">{ago(m.created_at)}</span>
                    {!m.is_read && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl ring-1 ring-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-primary-dark">Aktivitas terakhir</h2>
            <Link href="/admin/aktivitas" className="text-sm text-accent font-medium hover:underline">Semua log</Link>
          </div>
          {((audit.data ?? []) as AuditEntry[]).length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">Belum ada aktivitas.</p>
          ) : (
            <ul className="space-y-3">
              {((audit.data ?? []) as AuditEntry[]).map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent-light mt-2 shrink-0" />
                  <p className="flex-1 text-neutral-600"><b className="text-neutral-800">{a.user_email.split("@")[0]}</b> {a.action} {a.entity.toLowerCase()} <span className="text-neutral-800">{a.label && `“${a.label}”`}</span></p>
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">{ago(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
            {[["Tambah berita", "/admin/berita"], ["Tambah agenda", "/admin/agenda"], ["Unggah foto", "/admin/gallery"], ["Tambah pengurus", "/admin/kepengurusan"]].map(([l, h]) => (
              <Link key={h} href={h} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-surface text-primary hover:bg-surface-alt"><Plus size={13} />{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
