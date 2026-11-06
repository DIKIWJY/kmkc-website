import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Eye, Inbox, Info, Plus, TrendingDown, TrendingUp, UserPlus, Users, type LucideIcon } from "lucide-react";
import { getAdmin } from "@/lib/admin/guard";
import { todayWIB } from "@/lib/date";
import { getStats } from "@/lib/admin/stats";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui";
import TrafficPanel from "@/components/admin/charts/TrafficPanel";
import Donut from "@/components/admin/charts/Donut";
import HBars from "@/components/admin/charts/HBars";
import Sparkline from "@/components/admin/charts/Sparkline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactMessage, AuditEntry, SiteSettings } from "@/lib/types";

const nf = new Intl.NumberFormat("id-ID");
const DEVICE: Record<string, { label: string; color: string }> = {
  mobile: { label: "HP", color: "var(--chart-1)" },
  desktop: { label: "Komputer", color: "var(--chart-4)" },
  tablet: { label: "Tablet", color: "var(--chart-3)" },
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

type Reg = { id: string; full_name: string; campus: string; village: string; created_at: string };

function Stat({ label, value, sub, icon: Icon, href, children }: { label: string; value: number; sub: React.ReactNode; icon: LucideIcon; href?: string; children?: React.ReactNode }) {
  const card = (
    <Card className="h-full gap-0 py-0">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{nf.format(value)}</p>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-[18px]" /></span>
      </div>
      {children}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">{card}</Link>
  ) : card;
}

/** Baris daftar bertautan di dalam kartu (pakai di dalam <ul className="divide-y">). */
const rowCls = "flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/50";

export default async function Dashboard() {
  const { supabase, email } = await getAdmin();
  const count = (t: string) => supabase.from(t).select("id", { count: "exact", head: true });
  // Komponen server yang dirender per-request (halaman admin dinamis), jadi Date.now() di sini aman.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [members, programs, gallery, events, articles, drafts, msgs, unread, recent, series, audit, settings, regsTotal, regsWeek, stats, regsRecent] = await Promise.all([
    count("members"), count("programs"), count("gallery"), count("events").gte("event_date", todayWIB()), count("articles").eq("published", true),
    count("articles").eq("published", false), count("contact_messages"), count("contact_messages").eq("is_read", false),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("contact_messages").select("created_at").gte("created_at", since.toISOString()),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    count("registrations"),
    count("registrations").gte("created_at", weekAgo),
    getStats(supabase),
    supabase.from("registrations").select("id,full_name,campus,village,created_at").order("created_at", { ascending: false }).limit(4),
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
    { ok: !!s.tagline, label: "Tagline organisasi terisi", href: "/admin/pengaturan" },
    { ok: !!s.about_photo, label: "Foto kebersamaan diunggah", href: "/admin/pengaturan" },
    { ok: (members.count ?? 0) >= 4, label: "Minimal 4 pengurus ditambahkan", href: "/admin/kepengurusan" },
    { ok: (gallery.count ?? 0) >= 6, label: "Minimal 6 foto galeri", href: "/admin/galeri" },
    { ok: !!(s.instagram || s.whatsapp), label: "Instagram / WhatsApp dihubungkan", href: "/admin/pengaturan" },
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
    { n: unread.count ?? 0, label: "pesan belum dibaca", href: "/admin/pesan" },
    { n: drafts.count ?? 0, label: "draf berita", href: "/admin/berita" },
  ].filter((x) => x.n > 0);

  const content = [
    { label: "Pengurus", v: members.count ?? 0, href: "/admin/kepengurusan" },
    { label: "Program kerja", v: programs.count ?? 0, href: "/admin/program-kerja" },
    { label: "Agenda mendatang", v: events.count ?? 0, href: "/admin/agenda" },
    { label: "Foto galeri", v: gallery.count ?? 0, href: "/admin/galeri" },
    { label: "Berita terbit", v: articles.count ?? 0, extra: drafts.count ? `${drafts.count} draf` : undefined, href: "/admin/berita" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan"
        subtitle={<>{salam}, <span className="capitalize">{email.split("@")[0]}</span> · {tanggal}</>}
      >
        <Button asChild variant="outline"><Link href="/admin/agenda"><CalendarDays /> Tambah agenda</Link></Button>
        <Button asChild><Link href="/admin/berita"><Plus /> Tulis berita</Link></Button>
      </PageHeader>

      {pending.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
          <span className="me-1 text-muted-foreground">Perlu tindak lanjut:</span>
          {pending.map((x) => (
            <Button key={x.label} asChild variant="outline" size="sm">
              <Link href={x.href}><b className="tabular-nums">{nf.format(x.n)}</b> {x.label} <ArrowUpRight className="opacity-60" /></Link>
            </Button>
          ))}
        </div>
      )}

      {!stats.ok && (
        <Alert>
          <Info />
          <AlertTitle>Statistik pengunjung belum aktif</AlertTitle>
          <AlertDescription>
            Jalankan ulang <code className="rounded bg-muted px-1 text-foreground">supabase/schema.sql</code> di SQL Editor (aman diulang). Grafik terisi otomatis begitu ada pengunjung.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistik utama */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Pengunjung · 30 hari"
          value={sum30("visitors")}
          icon={Users}
          sub={
            delta !== null ? (
              <span className="inline-flex items-center gap-1">
                <Badge variant={delta < 0 ? "danger" : "success"} className="gap-0.5 px-1.5">
                  {delta < 0 ? <TrendingDown /> : <TrendingUp />} {delta > 0 ? "+" : ""}{delta}%
                </Badge>
                dari 30 hari sebelumnya
              </span>
            ) : today ? `${nf.format(today.visitors)} hari ini` : "30 hari terakhir"
          }
        >
          <div className="px-5 pb-4 text-chart-1"><Sparkline values={last30.map((d) => d.visitors)} /></div>
        </Stat>
        <Stat label="Tampilan halaman · 30 hari" value={sum30("views")} icon={Eye} sub={today ? `${nf.format(today.views)} hari ini` : "30 hari terakhir"} />
        <Stat label="Total anggota" value={regsTotal.count ?? 0} icon={UserPlus} sub={`${nf.format(regsWeek.count ?? 0)} pendaftar baru minggu ini`} href="/admin/pendaftar" />
        <Stat label="Pesan belum dibaca" value={unread.count ?? 0} icon={Inbox} sub={`${nf.format(msgs.count ?? 0)} pesan total`} href="/admin/pesan" />
      </div>

      {/* Lalu lintas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Lalu lintas</CardTitle>
            <CardDescription>Tampilan halaman dan pengunjung harian</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficPanel daily={stats.daily} />
          </CardContent>
        </Card>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Perangkat</CardTitle>
              <CardDescription>30 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <Donut centerLabel="tampilan" items={stats.devices.map((d) => ({ label: DEVICE[d.key]?.label ?? d.key, value: d.views, color: DEVICE[d.key]?.color ?? "var(--muted-foreground)" }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sumber kunjungan</CardTitle>
              <CardDescription>30 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <HBars items={stats.sources.slice(0, 5).map((d) => ({ label: SOURCE[d.key] ?? d.key, value: d.views }))} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Halaman terpopuler</CardTitle>
            <CardDescription>30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <HBars items={stats.pages.slice(0, 6).map((d) => ({ label: pageLabel(d.key), value: d.views }))} empty="Belum ada kunjungan tercatat." />
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Isi website</CardTitle>
            <CardDescription>Klik untuk mengelola</CardDescription>
          </CardHeader>
          <ul className="divide-y border-t">
            {content.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className={rowCls}>
                  <span className="flex-1">{c.label}</span>
                  {c.extra && <Badge variant="muted">{c.extra}</Badge>}
                  <span className="font-medium tabular-nums">{nf.format(c.v)}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Kelengkapan</CardTitle>
            <CardDescription>{done} dari {checklist.length} selesai</CardDescription>
            <CardAction><span className="text-sm font-medium tabular-nums text-primary">{Math.round((done / checklist.length) * 100)}%</span></CardAction>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={checklist.length} aria-label="Kelengkapan website">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(done / checklist.length) * 100}%` }} />
            </div>
          </div>
          <ul className="divide-y border-t">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className={rowCls}>
                  <span className={cn("flex size-[18px] shrink-0 items-center justify-center rounded-full", c.ok ? "bg-primary text-primary-foreground" : "border border-input")}>
                    {c.ok && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn("flex-1", c.ok && "text-muted-foreground")}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Pesan masuk</CardTitle>
            <CardDescription>14 hari terakhir</CardDescription>
            <CardAction><Button asChild variant="ghost" size="sm"><Link href="/admin/pesan">Buka kotak masuk</Link></Button></CardAction>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex items-end gap-1.5" role="img" aria-label={`Pesan masuk 14 hari terakhir: ${days.reduce((a, d) => a + d.n, 0)} pesan`}>
              {days.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-24 w-full items-end">
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(d.n ? 8 : 3, Math.round((d.n / max) * 96))}px`, opacity: d.n ? 1 : 0.15 }} title={`${d.n} pesan`} />
                  </div>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
          {msgList.length > 0 ? (
            <ul className="divide-y border-t">
              {msgList.map((m) => (
                <li key={m.id}>
                  <Link href="/admin/pesan" className={rowCls}>
                    <span className={cn("size-2 shrink-0 rounded-full", m.is_read ? "bg-transparent" : "bg-primary")} aria-label={m.is_read ? undefined : "Belum dibaca"} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate", m.is_read ? "text-muted-foreground" : "font-semibold")}>{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.subject || m.message}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{ago(m.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t py-8 text-center text-sm text-muted-foreground">Belum ada pesan.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Pendaftar terbaru</CardTitle>
              <CardDescription>Masuk lewat /daftar</CardDescription>
              <CardAction><Button asChild variant="ghost" size="sm"><Link href="/admin/pendaftar">Lihat semua</Link></Button></CardAction>
            </CardHeader>
            {regs.length === 0 ? (
              <p className="border-t py-8 text-center text-sm text-muted-foreground">Belum ada pendaftar. Bagikan tautan <b className="font-semibold text-foreground">/daftar</b> ke calon anggota.</p>
            ) : (
              <ul className="divide-y border-t">
                {regs.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{[r.campus, r.village].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{ago(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Aktivitas terakhir</CardTitle>
              <CardDescription>Perubahan oleh admin</CardDescription>
              <CardAction><Button asChild variant="ghost" size="sm"><Link href="/admin/aktivitas">Semua log</Link></Button></CardAction>
            </CardHeader>
            {logs.length === 0 ? (
              <p className="border-t py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
            ) : (
              <ul className="divide-y border-t">
                {logs.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                    <p className="min-w-0 flex-1 text-muted-foreground">
                      <b className="font-semibold text-foreground">{a.user_email.split("@")[0]}</b> {a.action} {a.entity.toLowerCase()} {a.label && <span className="text-foreground">“{a.label}”</span>}
                    </p>
                    <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground">{ago(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
