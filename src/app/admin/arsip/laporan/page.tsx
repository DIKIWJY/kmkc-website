import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin/guard";
import { getStats } from "@/lib/admin/stats";
import { parseArchive, ARCHIVE_SECTIONS, type ArchiveKey } from "@/lib/admin/archive-shared";
import { sampleSettings } from "@/lib/sample-data";
import PrintBar from "@/components/admin/PrintBar";
import Logo from "@/components/ui/Logo";
import type { Article, ContactMessage, Division, EventItem, GalleryItem, Member, Period, Program, SiteSettings } from "@/lib/types";
import { buildOrg } from "@/lib/org";
import "./report.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laporan arsip", robots: { index: false, follow: false } };

type Reg = { id: string; full_name: string; phone: string; email: string; village: string; campus: string; major: string; batch: string; message: string; follow_proof: string; status: string; note: string; created_at: string };

const TZ = "Asia/Jakarta";
const fmtD = (v?: string | null) => {
  if (!v) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00Z`) : new Date(v);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
};
const fmtDT = (v: string) => new Date(v).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(".", ":");
const dayOf = (v?: string | null) => (v ? (/^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : new Date(v).toISOString().slice(0, 10)) : "");
const STATUS: Record<string, string> = { baru: "Baru", dihubungi: "Dihubungi", diterima: "Diterima", ditolak: "Ditolak", upcoming: "Akan datang", ongoing: "Berjalan", completed: "Selesai" };
const nf = new Intl.NumberFormat("id-ID");

/** Markdown ringan → paragraf teks biasa (laporan tidak memuat HTML/format penulis). */
const plain = (md: string) =>
  md.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.replace(/^#{1,3}\s+/gm, "").replace(/^\s*>\s?/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim()).filter(Boolean);

function Head({ n, title, count }: { n: string; title: string; count: number | string }) {
  return (
    <div className="sec-head"><span className="n">{n}</span><h2>{title}</h2><span className="c">{count}{typeof count === "number" ? " data" : ""}</span></div>
  );
}
const Empty = ({ t }: { t: string }) => <p className="empty">{t}</p>;

export default async function Laporan({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = parseArchive(await searchParams);
  const { supabase, email } = await getAdmin();
  const has = (k: ArchiveKey) => o.sections.includes(k);
  const inRange = (v?: string | null) => {
    const d = dayOf(v);
    if (!d) return !o.from && !o.to;
    return (!o.from || d >= o.from) && (!o.to || d <= o.to);
  };
  const rows = async <T,>(table: string, order: string, asc = true, limit = 3000): Promise<T[]> => {
    const { data } = await supabase.from(table).select("*").order(order, { ascending: asc }).limit(limit);
    return (data ?? []) as T[];
  };

  // Pengurus disusun per periode (terbaru dulu) → bidang → urutan jabatan, sama seperti di website.
  const [perRes, divRes] = has("pengurus")
    ? await Promise.all([supabase.from("periods").select("*"), supabase.from("divisions").select("*")])
    : [{ data: [] }, { data: [] }];
  const [settingsRow, members, programs, events, articles, gallery, regs, messages, stats] = await Promise.all([
    has("profil") ? supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then((r) => r.data) : null,
    has("pengurus") ? rows<Member>("members", "order_index") : [],
    has("program") ? rows<Program>("programs", "start_date") : [],
    has("agenda") ? rows<EventItem>("events", "event_date") : [],
    has("berita") ? rows<Article>("articles", "published_at", false) : [],
    has("galeri") ? rows<GalleryItem>("gallery", "event_date", false) : [],
    has("pendaftar") ? rows<Reg>("registrations", "created_at") : [],
    has("pesan") ? rows<ContactMessage>("contact_messages", "created_at") : [],
    has("statistik") ? getStats(supabase) : null,
  ]);

  const orderedMembers = buildOrg(members as Member[], (perRes.error ? [] : perRes.data ?? []) as Period[], (divRes.error ? [] : divRes.data ?? []) as Division[])
    .flatMap((p) => p.divisions.flatMap((d) => d.members));

  const s = { ...sampleSettings, ...(settingsRow ?? {}) } as SiteSettings;
  const fArticles = (articles as Article[]).filter((a) => inRange(a.published_at ?? a.created_at));
  const fEvents = (events as EventItem[]).filter((e) => inRange(e.event_date));
  const fGallery = (gallery as GalleryItem[]).filter((g) => inRange(g.event_date ?? g.created_at));
  const fRegs = (regs as Reg[]).filter((r) => inRange(r.created_at));
  const fMsgs = (messages as ContactMessage[]).filter((m) => inRange(m.created_at));

  const counts: Record<ArchiveKey, number | string> = {
    profil: "1 halaman", pengurus: (members as Member[]).length, program: (programs as Program[]).length, agenda: fEvents.length,
    berita: fArticles.length, galeri: fGallery.length, pendaftar: fRegs.length, pesan: fMsgs.length, statistik: "30 hari",
  };
  const now = new Date();
  const stamp = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const period = o.from || o.to ? `${o.from ? fmtD(o.from) : "awal"} – ${o.to ? fmtD(o.to) : "sekarang"}` : "Seluruh data";
  const fileTitle = `Arsip-${(s.name || "KMKC").replace(/\s+/g, "-")}-${now.toISOString().slice(0, 10)}`;

  const numOf = (k: ArchiveKey) => String(o.sections.indexOf(k) + 1).padStart(2, "0");
  const H = (k: ArchiveKey, title: string) => <Head n={numOf(k)} title={title} count={counts[k]} />;

  const last30 = stats?.daily.slice(-30) ?? [];
  const sum = (key: "views" | "visitors") => last30.reduce((a, d) => a + d[key], 0);

  return (
    <div className="rpt-wrap">
      <PrintBar auto={o.auto} title={fileTitle} />
      <main className="rpt">
        {/* ---------------- Sampul ---------------- */}
        <section className="cover">
          <div className="cover-mark"><Logo size={72} alt="" className="h-[18mm] w-[18mm]" /></div>
          <p className="cover-kicker">Arsip data</p>
          <h1>{s.full_name || s.name}</h1>
          <p className="cover-org">Laporan arsip website &amp; administrasi · {period}</p>

          <div className="toc">
            <h2>Isi laporan</h2>
            <ol>
              {ARCHIVE_SECTIONS.filter((x) => has(x.key)).map((x, i) => (
                <li key={x.key}><span className="n">{String(i + 1).padStart(2, "0")}</span>{x.label}<span className="c">{counts[x.key]}{typeof counts[x.key] === "number" ? " data" : ""}</span></li>
              ))}
            </ol>
          </div>

          <dl className="cover-meta">
            <dt>Dibuat pada</dt><dd>{stamp}</dd>
            <dt>Dibuat oleh</dt><dd>{email}</dd>
            <dt>Periode</dt><dd>{period}</dd>
            <dt>Sumber</dt><dd>Database {s.name} (Supabase)</dd>
          </dl>
        </section>

        {/* ---------------- Profil ---------------- */}
        {has("profil") && (
          <section className="sec pg">
            {H("profil", "Profil organisasi")}
            <dl className="kv">
              <dt>Nama singkat</dt><dd>{s.name}</dd>
              <dt>Nama lengkap</dt><dd>{s.full_name}</dd>
              <dt>Tagline</dt><dd>{s.tagline || "—"}</dd>
              <dt>Email</dt><dd>{s.email || "—"}</dd>
              <dt>WhatsApp</dt><dd>{s.whatsapp || "—"}</dd>
              <dt>Alamat</dt><dd>{s.address || "—"}</dd>
              <dt>Instagram</dt><dd>{s.instagram || "—"}</dd>
            </dl>
            <h3 className="sub">Tentang organisasi</h3>
            <div className="prose">{plain(s.about).map((p, i) => <p key={i}>{p}</p>)}</div>
            <h3 className="sub">Visi</h3>
            <div className="prose">{plain(s.vision).map((p, i) => <p key={i}>{p}</p>)}</div>
            <h3 className="sub">Misi</h3>
            <ol className="prose" style={{ paddingLeft: "5mm", listStyle: "decimal" }}>{s.mission.map((m, i) => <li key={i} style={{ marginBottom: "1.6mm" }}>{m}</li>)}</ol>
            {s.history && (<><h3 className="sub">Sejarah</h3><div className="prose">{plain(s.history).map((p, i) => <p key={i}>{p}</p>)}</div></>)}
            {s.timeline.length > 0 && (
              <>
                <h3 className="sub">Linimasa</h3>
                <table><thead><tr><th>Waktu</th><th>Peristiwa</th></tr></thead><tbody>
                  {s.timeline.map((t, i) => <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{t.date}</td><td><b>{t.title}</b><div className="muted">{plain(t.desc).join(" ")}</div></td></tr>)}
                </tbody></table>
              </>
            )}
            {s.founders.length > 0 && (
              <>
                <h3 className="sub">Para penggagas</h3>
                <table><thead><tr><th>Nama</th><th>Asal</th><th>Peran</th></tr></thead><tbody>
                  {s.founders.map((f, i) => <tr key={i}><td>{f.name}</td><td>{f.campus}</td><td>{f.role || "—"}</td></tr>)}
                </tbody></table>
              </>
            )}
          </section>
        )}

        {/* ---------------- Pengurus ---------------- */}
        {has("pengurus") && (
          <section className="sec">
            {H("pengurus", "Kepengurusan")}
            {orderedMembers.length === 0 ? <Empty t="Belum ada pengurus." /> : (
              <table><thead><tr><th className="num">No</th><th>Nama</th><th>Jabatan</th><th>Bidang</th><th>Periode</th></tr></thead><tbody>
                {orderedMembers.map((m, i) => <tr key={m.id}><td className="num">{i + 1}</td><td><b>{m.name}</b></td><td>{m.position}</td><td>{m.division || "—"}</td><td>{m.period || "—"}</td></tr>)}
              </tbody></table>
            )}
          </section>
        )}

        {/* ---------------- Program ---------------- */}
        {has("program") && (
          <section className="sec">
            {H("program", "Program kerja")}
            {(programs as Program[]).length === 0 ? <Empty t="Belum ada program kerja." /> : (
              <table><thead><tr><th className="num">No</th><th>Program</th><th>Bidang</th><th>Status</th><th>Pelaksanaan</th></tr></thead><tbody>
                {(programs as Program[]).map((p, i) => (
                  <tr key={p.id}><td className="num">{i + 1}</td><td><b>{p.name}</b><div className="muted">{p.description}</div></td><td>{p.division || "—"}</td><td><span className="tag">{STATUS[p.status] ?? p.status}</span></td><td style={{ whiteSpace: "nowrap" }}>{p.start_date ? `${fmtD(p.start_date)}${p.end_date ? ` – ${fmtD(p.end_date)}` : ""}` : p.period || "—"}</td></tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}

        {/* ---------------- Agenda ---------------- */}
        {has("agenda") && (
          <section className="sec">
            {H("agenda", "Agenda")}
            {fEvents.length === 0 ? <Empty t="Tidak ada agenda pada periode ini." /> : (
              <table><thead><tr><th className="num">No</th><th>Tanggal</th><th>Kegiatan</th><th>Lokasi</th></tr></thead><tbody>
                {fEvents.map((e, i) => (
                  <tr key={e.id}><td className="num">{i + 1}</td><td style={{ whiteSpace: "nowrap" }}>{fmtD(e.event_date)}<div className="muted">{e.event_time}</div></td><td><b>{e.title}</b><div className="muted">{e.description}</div></td><td>{e.location || "—"}</td></tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}

        {/* ---------------- Berita ---------------- */}
        {has("berita") && (
          <section className={`sec ${o.fullText ? "pg" : ""}`}>
            {H("berita", "Berita & artikel")}
            {fArticles.length === 0 ? <Empty t="Tidak ada berita pada periode ini." /> : o.fullText ? (
              fArticles.map((a) => (
                <article className="item" key={a.id} style={{ breakInside: "auto" }}>
                  <p style={{ fontSize: "8.5pt", color: "#6e6e73" }}>{a.category} · {fmtD(a.published_at ?? a.created_at)} · {a.published ? "Terbit" : "Draf"}{a.author ? ` · ${a.author}` : ""}</p>
                  <h3 style={{ fontSize: "13pt", fontWeight: 700, margin: "1mm 0 2.5mm", letterSpacing: "-.01em", breakAfter: "avoid" }}>{a.title}</h3>
                  {a.excerpt && <p style={{ color: "#424245", fontStyle: "italic", marginBottom: "2.5mm" }}>{a.excerpt}</p>}
                  <div className="prose">{plain(a.content).map((p, i) => <p key={i}>{p}</p>)}</div>
                </article>
              ))
            ) : (
              <table><thead><tr><th className="num">No</th><th>Tanggal</th><th>Judul</th><th>Kategori</th><th>Status</th></tr></thead><tbody>
                {fArticles.map((a, i) => (
                  <tr key={a.id}><td className="num">{i + 1}</td><td style={{ whiteSpace: "nowrap" }}>{fmtD(a.published_at ?? a.created_at)}</td><td><b>{a.title}</b><div className="muted">{a.excerpt}</div></td><td>{a.category}</td><td><span className={`tag ${a.published ? "" : "gray"}`}>{a.published ? "Terbit" : "Draf"}</span></td></tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}

        {/* ---------------- Galeri ---------------- */}
        {has("galeri") && (
          <section className="sec">
            {H("galeri", "Galeri")}
            {fGallery.length === 0 ? <Empty t="Tidak ada foto pada periode ini." /> : o.photos ? (
              <div className="photos">
                {fGallery.map((g) => (
                  <figure key={g.id}>
                    { }
                    <img src={g.image_url} alt="" loading="eager" />
                    <figcaption><b>{g.title}</b><br /><span style={{ color: "#6e6e73" }}>{fmtD(g.event_date ?? g.created_at)} · {g.category}</span></figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <table><thead><tr><th className="num">No</th><th>Tanggal</th><th>Judul</th><th>Kategori</th></tr></thead><tbody>
                {fGallery.map((g, i) => <tr key={g.id}><td className="num">{i + 1}</td><td style={{ whiteSpace: "nowrap" }}>{fmtD(g.event_date ?? g.created_at)}</td><td><b>{g.title}</b><div className="muted">{g.description}</div></td><td>{g.category}</td></tr>)}
              </tbody></table>
            )}
          </section>
        )}

        {/* ---------------- Pendaftar ---------------- */}
        {has("pendaftar") && (
          <section className="sec pg">
            {H("pendaftar", "Pendaftar anggota")}
            {fRegs.length === 0 ? <Empty t="Tidak ada pendaftar pada periode ini." /> : (
              <div>
                {fRegs.map((r, i) => {
                  const showProof = o.proofs && !!r.follow_proof;
                  return (
                    <article className="item" key={r.id}>
                      <div className={`reg ${showProof ? "" : "no-proof"}`}>
                        <div>
                          <h4><span style={{ color: "#86868b", fontWeight: 500 }}>{String(i + 1).padStart(3, "0")}</span>{r.full_name}<span className={`tag ${r.status === "baru" || r.status === "diterima" ? "" : "gray"}`}>{STATUS[r.status] ?? r.status}</span></h4>
                          <dl>
                            <dt>Terdaftar</dt><dd>{fmtDT(r.created_at)}</dd>
                            <dt>WhatsApp</dt><dd>{r.phone}</dd>
                            <dt>Email</dt><dd>{r.email || "—"}</dd>
                            <dt>Kampus</dt><dd>{[r.campus, r.major].filter(Boolean).join(" · ") || "—"}{r.batch ? ` (angkatan ${r.batch})` : ""}</dd>
                            <dt>Desa asal</dt><dd>{r.village || "—"}</dd>
                            <dt>Bukti follow</dt><dd>{r.follow_proof ? (o.proofs ? "Terlampir" : "Ada (tidak dicetak)") : "Tidak ada / sudah dihapus"}</dd>
                          </dl>
                          {r.message && <p className="reason"><b>Alasan bergabung</b>{r.message}</p>}
                          {r.note && <p className="reason"><b>Catatan pengurus</b>{r.note}</p>}
                        </div>
                        {showProof && (
                          <div className="proof">
                            { }
                            <img src={`/admin/bukti/${r.follow_proof}`} alt={`Bukti follow ${r.full_name}`} loading="eager" />
                            <span>Bukti follow Instagram</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ---------------- Pesan ---------------- */}
        {has("pesan") && (
          <section className="sec">
            {H("pesan", "Pesan masuk")}
            {fMsgs.length === 0 ? <Empty t="Tidak ada pesan pada periode ini." /> : fMsgs.map((m) => (
              <article className="item" key={m.id}>
                <p style={{ fontSize: "8.5pt", color: "#6e6e73" }}>{fmtDT(m.created_at)} · {m.name} · {m.email}</p>
                {m.subject && <p style={{ fontWeight: 600, margin: "1mm 0" }}>{m.subject}</p>}
                <div className="prose" style={{ marginTop: "1.5mm" }}>{m.message.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
              </article>
            ))}
          </section>
        )}

        {/* ---------------- Statistik ---------------- */}
        {has("statistik") && (
          <section className="sec">
            {H("statistik", "Statistik pengunjung")}
            {!stats?.ok ? <Empty t="Statistik belum aktif di database." /> : (
              <>
                <div className="kpis">
                  <div><b>{nf.format(sum("views"))}</b><span>Tampilan halaman · 30 hari terakhir</span></div>
                  <div><b>{nf.format(sum("visitors"))}</b><span>Pengunjung · 30 hari terakhir</span></div>
                </div>
                <h3 className="sub">Halaman terpopuler</h3>
                <table><thead><tr><th>Halaman</th><th style={{ textAlign: "right" }}>Tampilan</th></tr></thead><tbody>{stats.pages.map((p) => <tr key={p.key}><td>{p.key}</td><td style={{ textAlign: "right" }}>{nf.format(p.views)}</td></tr>)}</tbody></table>
                <h3 className="sub">Sumber kunjungan</h3>
                <table><thead><tr><th>Sumber</th><th style={{ textAlign: "right" }}>Tampilan</th></tr></thead><tbody>{stats.sources.map((p) => <tr key={p.key}><td style={{ textTransform: "capitalize" }}>{p.key}</td><td style={{ textAlign: "right" }}>{nf.format(p.views)}</td></tr>)}</tbody></table>
                <h3 className="sub">Perangkat</h3>
                <table><thead><tr><th>Perangkat</th><th style={{ textAlign: "right" }}>Tampilan</th></tr></thead><tbody>{stats.devices.map((p) => <tr key={p.key}><td style={{ textTransform: "capitalize" }}>{p.key}</td><td style={{ textAlign: "right" }}>{nf.format(p.views)}</td></tr>)}</tbody></table>
              </>
            )}
          </section>
        )}

        <p className="colophon">Dokumen ini dibuat otomatis dari database {s.name} pada {stamp} oleh {email}. Simpan di tempat yang aman: berisi data pribadi pendaftar dan pesan.</p>
      </main>
    </div>
  );
}
