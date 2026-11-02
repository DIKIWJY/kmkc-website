import Link from "next/link";
import { ChevronRight, Info, Check, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { getAdmin } from "@/lib/admin/guard";
import { todayWIB } from "@/lib/date";
import { getStats } from "@/lib/admin/stats";
import { Section, Card } from "@/components/admin/ui";
import TrafficPanel from "@/components/admin/charts/TrafficPanel";
import Donut from "@/components/admin/charts/Donut";
import HBars from "@/components/admin/charts/HBars";
import AreaSpark from "@/components/admin/charts/AreaSpark";
import type { ContactMessage, AuditEntry, SiteSettings } from "@/lib/types";

const nf = new Intl.NumberFormat("id-ID");
const DEVICE: Record<string, { label: string; color: string }> = {
  mobile: { label: "HP", color: "#0071e3" },
  desktop: { label: "Komputer", color: "#003f7d" },
  tablet: { label: "Tablet", color: "#7cb8f4" },
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

type Reg = { id: string; full_name: string; campus: string; village: string; status: string; created_at: string };

export default async function Dashboard() {
  const { supabase, email } = await getAdmin();
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
    supabase.from("registrations").select("id,full_name,campus,village,status,created_at").order("created_at", { ascending: false }).limit(4),
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
    { ok: !!s.about_photo, label: "Foto kebersamaan diunggah", href: "/admin/settings" },
    { ok: (members.count ?? 0) >= 4, label: "Minimal 4 pengurus ditambahkan", href: "/admin/kepengurusan" },
    { ok: (gallery.count ?? 0) >= 6, label: "Minimal 6 foto galeri", href: "/admin/gallery" },
    { ok: !!(s.instagram || s.whatsapp), label: "Instagram / WhatsApp dihubungkan", href: "/admin/settings" },
    { ok: (articles.count ?? 0) >= 1, label: "Minimal 1 berita terbit", href: "/admin/berita" },
    { ok: (events.count ?? 0) >= 1, label: "Ada agenda mendatang", href: "/admin/agenda" },
  ];
  const done = checklist.filter((c) => c.ok).length;
  const regs = (regsRecent.data ?? []) as Reg[];
  const msgList = (recent.data ?? []) as ContactMessage[];
  const logs = (audit.data ?? []) as AuditEntry[];

  // Salam sesuai jam WIB + tanggal lengkap
  // eslint-disable-next-line react-hooks/purity
  const wib = new Date(Date.now() + 7 * 3600e3);
  const h = wib.getUTCHours();
  const salam = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  const tanggal = wib.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const prev30 = stats.daily.slice(-60, -30).reduce((a, d) => a + d.visitors, 0);
  const delta = stats.daily.length >= 60 && prev30 > 0 ? Math.round(((sum30("visitors") - prev30) / prev30) * 100) : null;
  const pending = [
    { n: regsNew.count ?? 0, label: "pendaftar baru", href: "/admin/pendaftar" },
    { n: unread.count ?? 0, label: "pesan belum dibaca", href: "/admin/pesan" },
    { n: drafts.count ?? 0, label: "draf berita", href: "/admin/berita" },
  ].filter((x) => x.n > 0);

  const strip = [
    { label: "Tampilan halaman", v: sum30("views"), sub: today ? `${nf.format(today.views)} hari ini` : "30 hari terakhir", href: undefined as string | undefined },
    { label: "Pengunjung", v: sum30("visitors"), sub: today ? `${nf.format(today.visitors)} hari ini` : "30 hari terakhir", href: undefined },
    { label: "Pendaftar baru", v: regsNew.count ?? 0, sub: "menunggu tindak lanjut", href: "/admin/pendaftar" },
    { label: "Pesan belum dibaca", v: unread.count ?? 0, sub: `${nf.format(msgs.count ?? 0)} pesan total`, href: "/admin/pesan" },
  ];

  const content = [
    { label: "Pengurus", v: members.count ?? 0, href: "/admin/kepengurusan" },
    { label: "Program kerja", v: programs.count ?? 0, href: "/admin/program" },
    { label: "Agenda mendatang", v: events.count ?? 0, href: "/admin/agenda" },
    { label: "Foto galeri", v: gallery.count ?? 0, href: "/admin/gallery" },
    { label: "Berita terbit", v: articles.count ?? 0, extra: drafts.count ? `${drafts.count} draf` : undefined, href: "/admin/berita" },
  ];

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="ad-hero ad-rise" aria-label="Ringkasan utama">
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:p-10">
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div>
              <p className="ad-hero-eyebrow"><span className="ad-pulse" aria-hidden /> {tanggal}</p>
              <h1 className="mt-4 text-[32px] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
                {salam}, <span className="capitalize">{email.split("@")[0]}</span>
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                {pending.length ? "Ada yang menunggu tindak lanjut dari kamu hari ini." : "Semua beres. Tidak ada yang menunggu tindak lanjut saat ini."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pending.map((x) => (
                <Link key={x.label} href={x.href} className="ad-chip"><b className="tnum">{nf.format(x.n)}</b> {x.label} <ArrowUpRight size={14} className="opacity-60" /></Link>
              ))}
              {!pending.length && <Link href="/admin/berita" className="ad-chip">Tulis berita baru <ArrowUpRight size={14} className="opacity-60" /></Link>}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] text-white/55">Pengunjung · 30 hari terakhir</p>
                <p className="mt-2 text-[48px] font-bold leading-none tracking-[-0.045em] tnum sm:text-[56px]">{nf.format(sum30("visitors"))}</p>
              </div>
              {delta !== null && (
                <span className={`ad-delta mt-1 ${delta < 0 ? "down" : ""}`} title="Dibanding 30 hari sebelumnya">
                  {delta < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />} {delta > 0 ? "+" : ""}{delta}%
                </span>
              )}
            </div>
            <AreaSpark values={last30.map((d) => d.visitors)} className="mt-4 h-[104px] w-full sm:h-[120px]" />
          </div>
        </div>

        <div className="ad-hero-strip">
          {strip.map((k) => {
            const body = (
              <>
                <small>{k.label}</small>
                <strong>{nf.format(k.v)}</strong>
                <span>{k.sub}</span>
              </>
            );
            return k.href ? <Link key={k.label} href={k.href} className="ad-hero-cell">{body}</Link> : <div key={k.label} className="ad-hero-cell">{body}</div>;
          })}
        </div>
      </section>

      {!stats.ok && (
        <div className="flex gap-3 rounded-[14px] bg-[var(--ad-blue-soft)] px-4 py-3 text-[14px] text-[#0b4a8f]">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            <b className="font-semibold">Statistik pengunjung belum aktif.</b> Jalankan ulang <code className="rounded bg-white/70 px-1">supabase/schema.sql</code> di SQL Editor (aman diulang). Grafik terisi otomatis begitu ada pengunjung.
          </p>
        </div>
      )}

      {/* Lalu lintas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Lalu lintas" className="min-w-0 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <TrafficPanel daily={stats.daily.length ? stats.daily : []} />
          </Card>
        </Section>
        <div className="space-y-6">
          <Section title="Perangkat" hint="30 hari terakhir">
            <Card className="p-5">
              <Donut centerLabel="tampilan" items={stats.devices.map((d) => ({ label: DEVICE[d.key]?.label ?? d.key, value: d.views, color: DEVICE[d.key]?.color ?? "#a1a1a6" }))} />
            </Card>
          </Section>
          <Section title="Sumber kunjungan" hint="30 hari terakhir">
            <Card className="p-5">
              <HBars items={stats.sources.slice(0, 5).map((d) => ({ label: SOURCE[d.key] ?? d.key, value: d.views }))} />
            </Card>
          </Section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Halaman terpopuler" hint="30 hari terakhir">
          <Card className="p-5">
            <HBars items={stats.pages.slice(0, 6).map((d) => ({ label: pageLabel(d.key), value: d.views }))} empty="Belum ada kunjungan tercatat." />
          </Card>
        </Section>

        <Section title="Isi website" className="lg:col-span-1">
          <Card className="ad-divide">
            {content.map((c) => (
              <Link key={c.label} href={c.href} className="ad-row">
                <span className="flex-1 text-[15px]">{c.label}</span>
                {c.extra && <span className="ad-badge">{c.extra}</span>}
                <span className="font-medium tnum text-[var(--ad-ink-2)]">{nf.format(c.v)}</span>
                <ChevronRight size={16} className="text-[var(--ad-faint)]" />
              </Link>
            ))}
          </Card>
        </Section>

        <Section
          title="Kelengkapan"
          hint={`${done} dari ${checklist.length} selesai`}
          action={<span className="text-[13px] font-medium text-[var(--ad-blue)] tnum">{Math.round((done / checklist.length) * 100)}%</span>}
        >
          <Card>
            <div className="px-4 pt-4">
              <div className="h-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.07)]">
                <div className="h-full rounded-full bg-[var(--ad-blue)] transition-[width]" style={{ width: `${(done / checklist.length) * 100}%` }} />
              </div>
            </div>
            <ul className="ad-divide mt-2">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="ad-row min-h-[44px]">
                    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-[var(--ad-blue)] text-white" : "border border-[var(--ad-line-strong)]"}`}>
                      {c.ok && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 text-[14px] ${c.ok ? "text-[var(--ad-faint)]" : "text-[var(--ad-ink)]"}`}>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Pesan masuk" hint="14 hari terakhir" action={<Link href="/admin/pesan" className="ad-btn ad-btn-plain ad-btn-sm">Buka kotak masuk</Link>}>
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-end gap-1.5" role="img" aria-label={`Pesan masuk 14 hari terakhir: ${days.reduce((a, d) => a + d.n, 0)} pesan`}>
                {days.map((d) => (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                      <div className="w-full rounded-[4px] bg-[var(--ad-blue)]" style={{ height: `${Math.max(d.n ? 8 : 3, Math.round((d.n / max) * 96))}px`, opacity: d.n ? 1 : 0.15 }} title={`${d.n} pesan`} />
                    </div>
                    <span className="text-[10.5px] text-[var(--ad-faint)] tnum">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {msgList.length > 0 && (
              <ul className="ad-divide border-t border-[var(--ad-line)]">
                {msgList.map((m) => (
                  <li key={m.id}>
                    <Link href="/admin/pesan" className="ad-row">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${m.is_read ? "bg-transparent" : "bg-[var(--ad-blue)]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[14.5px] ${m.is_read ? "text-[var(--ad-ink-2)]" : "font-semibold"}`}>{m.name}</p>
                        <p className="truncate text-[13px] text-[var(--ad-mute)]">{m.subject || m.message}</p>
                      </div>
                      <span className="whitespace-nowrap text-[12px] text-[var(--ad-faint)]">{ago(m.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {msgList.length === 0 && <p className="border-t border-[var(--ad-line)] py-8 text-center text-[var(--ad-faint)]">Belum ada pesan.</p>}
          </Card>
        </Section>

        <div className="space-y-6">
          <Section title="Pendaftar terbaru" hint="Masuk lewat /daftar" action={<Link href="/admin/pendaftar" className="ad-btn ad-btn-plain ad-btn-sm">Lihat semua</Link>}>
            <Card>
              {regs.length === 0 ? (
                <p className="py-8 text-center text-[var(--ad-faint)]">Belum ada pendaftar. Bagikan tautan <b className="font-semibold">/daftar</b> ke calon anggota.</p>
              ) : (
                <ul className="ad-divide">
                  {regs.map((r) => (
                    <li key={r.id} className="ad-row">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-medium">{r.full_name}</p>
                        <p className="truncate text-[13px] text-[var(--ad-mute)]">{[r.campus, r.village].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                      <span className="whitespace-nowrap text-[12px] text-[var(--ad-faint)]">{ago(r.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section title="Aktivitas terakhir" hint="Perubahan oleh admin" action={<Link href="/admin/aktivitas" className="ad-btn ad-btn-plain ad-btn-sm">Semua log</Link>}>
            <Card>
              {logs.length === 0 ? (
                <p className="py-8 text-center text-[var(--ad-faint)]">Belum ada aktivitas.</p>
              ) : (
                <ul className="ad-divide">
                  {logs.map((a) => (
                    <li key={a.id} className="ad-row items-start">
                      <p className="min-w-0 flex-1 text-[14px] text-[var(--ad-mute)]">
                        <b className="font-semibold text-[var(--ad-ink)]">{a.user_email.split("@")[0]}</b> {a.action} {a.entity.toLowerCase()} {a.label && <span className="text-[var(--ad-ink)]">“{a.label}”</span>}
                      </p>
                      <span className="whitespace-nowrap pt-0.5 text-[12px] text-[var(--ad-faint)]">{ago(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>
        </div>
      </div>

      <Section title="Pintasan">
        <div className="flex flex-wrap gap-2">
          {[["Tambah berita", "/admin/berita"], ["Tambah agenda", "/admin/agenda"], ["Unggah foto", "/admin/gallery"], ["Tambah pengurus", "/admin/kepengurusan"]].map(([l, h]) => (
            <Link key={h} href={h} className="ad-btn">{l}</Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
