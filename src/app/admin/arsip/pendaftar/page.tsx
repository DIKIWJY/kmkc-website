import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin/guard";
import { sampleSettings } from "@/lib/sample-data";
import { REG_STATUSES, distinct, matchReg, norm, parseRegOptions, wibDay, type RegGroup } from "@/lib/admin/registrant-report";
import PrintBar from "@/components/admin/PrintBar";
import Logo from "@/components/ui/Logo";
import type { SiteSettings } from "@/lib/types";
import { rupiah } from "@/lib/money";
import "../laporan/report.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laporan pendaftar", robots: { index: false, follow: false } };

type Reg = { id: string; full_name: string; phone: string; email: string; village: string; campus: string; major: string; batch: string; message: string; follow_proof: string; status: string; note: string; created_at: string; fee_amount?: number; payment_proof?: string };

const TZ = "Asia/Jakarta";
const fmtD = (v: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00Z` : v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const fmtDT = (v: string) => new Date(v).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(".", ":");
const nf = new Intl.NumberFormat("id-ID");
const STATUS: Record<string, string> = Object.fromEntries(REG_STATUSES.map((s) => [s.key, s.label]));
const GROUP_LABEL: Record<RegGroup, string> = { none: "", village: "desa asal", campus: "kampus", batch: "angkatan", status: "status" };
const EMPTY = "Tidak diisi";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function Bars({ title, first, rows, total }: { title: string; first: string; rows: [string, number][]; total: number }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <>
      <h3 className="sub">{title}</h3>
      <table className="bars">
        <thead><tr><th>{first}</th><th style={{ width: "46%" }} aria-label="Grafik" /><th style={{ textAlign: "right" }}>Jumlah</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
        <tbody>
          {rows.map(([k, n]) => (
            <tr key={k}>
              <td>{k}</td>
              <td><span className="bar"><i style={{ width: `${Math.max(2, (n / max) * 100)}%` }} /></span></td>
              <td style={{ textAlign: "right" }}>{nf.format(n)}</td>
              <td style={{ textAlign: "right", color: "#6e6e73" }}>{Math.round((n / total) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default async function LaporanPendaftar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = parseRegOptions(await searchParams);
  const { supabase, email } = await getAdmin();
  const [settingsRow, regsRes] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then((r) => r.data),
    supabase.from("registrations").select("*").order("created_at", { ascending: false }).limit(3000),
  ]);
  const s = { ...sampleSettings, ...(settingsRow ?? {}) } as SiteSettings;
  const all = (regsRes.data ?? []) as Reg[];

  // Penulisan seragam: "desa sukun", "Desa Sukun " dst. dihitung sebagai satu.
  const canon = (vals: string[]) => { const m = new Map(distinct(vals).map((v) => [norm(v), v])); return (v: string) => m.get(norm(v)) ?? (v.trim() || EMPTY); };
  const cVillage = canon(all.map((r) => r.village)), cCampus = canon(all.map((r) => r.campus)), cBatch = canon(all.map((r) => r.batch));

  const rows = all.filter((r) => matchReg(r, o)).sort((a, b) =>
    o.sort === "name" ? a.full_name.localeCompare(b.full_name, "id") : o.sort === "old" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
  const total = rows.length;

  const tally = (f: (r: Reg) => string) => { const m = new Map<string, number>(); for (const r of rows) m.set(f(r), (m.get(f(r)) ?? 0) + 1); return [...m.entries()]; };
  const byCount = (e: [string, number][]) => e.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"));
  const topN = (e: [string, number][], n = 15): [string, number][] => { const s2 = byCount(e); if (s2.length <= n) return s2; const rest = s2.slice(n).reduce((a, x) => a + x[1], 0); return [...s2.slice(0, n), [`Lainnya (${s2.length - n})`, rest]]; };
  const statusRows: [string, number][] = REG_STATUSES.map((st) => [st.label, rows.filter((r) => r.status === st.key).length] as [string, number]).filter((x) => x[1] > 0);
  const monthRows = tally((r) => wibDay(r.created_at).slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0])).map(([k, n]): [string, number] => [`${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, n]);
  const withProof = rows.filter((r) => r.follow_proof).length;
  const count = (st: string) => rows.filter((r) => r.status === st).length;
  // HTM: hanya tampil bila ada pendaftar yang berkewajiban membayar
  const payers = rows.filter((r) => (r.fee_amount ?? 0) > 0);
  const hasFee = payers.length > 0;
  const feeSum = payers.reduce((a, r) => a + (r.fee_amount ?? 0), 0);

  // Pengelompokan daftar
  const keyOf: Record<RegGroup, (r: Reg) => string> = {
    none: () => "", village: (r) => cVillage(r.village), campus: (r) => cCampus(r.campus), batch: (r) => cBatch(r.batch), status: (r) => STATUS[r.status] ?? r.status,
  };
  const groups: { name: string; items: Reg[] }[] = [];
  if (o.group === "none") groups.push({ name: "", items: rows });
  else {
    const m = new Map<string, Reg[]>();
    for (const r of rows) { const k = keyOf[o.group](r); m.set(k, [...(m.get(k) ?? []), r]); }
    const order: string[] | null = o.group === "status" ? REG_STATUSES.map((x) => x.label) : null;
    groups.push(...[...m.entries()].sort((a, b) => order ? order.indexOf(a[0]) - order.indexOf(b[0]) : a[0] === EMPTY ? 1 : b[0] === EMPTY ? -1 : a[0].localeCompare(b[0], "id", { numeric: true })).map(([name, items]) => ({ name, items })));
  }

  // Deskripsi filter
  const statusAll = o.statuses.length === REG_STATUSES.length;
  const filters = [
    statusAll ? null : `Status: ${REG_STATUSES.filter((x) => o.statuses.includes(x.key)).map((x) => x.label).join(", ")}`,
    o.from || o.to ? `Terdaftar ${o.from ? fmtD(o.from) : "awal"} – ${o.to ? fmtD(o.to) : "sekarang"}` : null,
    o.village ? `Desa: ${o.village}` : null,
    o.campus ? `Kampus: ${o.campus}` : null,
    o.batch ? `Angkatan: ${o.batch}` : null,
  ].filter(Boolean) as string[];

  const now = new Date();
  const stamp = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const fileTitle = `Pendaftar-${(s.name || "KMKC").replace(/\s+/g, "-")}-${now.toISOString().slice(0, 10)}`;
  const sections = [o.stats && "Ringkasan statistik", "Daftar pendaftar"].filter(Boolean) as string[];
  const listNo = o.stats ? "02" : "01";

  // kolom rekap
  const cols = 3 + (o.contact ? 1 : 0) + 1;

  let n = 0;
  return (
    <div className="rpt-wrap">
      <style>{`@page { @bottom-left { content: "Laporan pendaftar · ${(s.name || "KMKC").replace(/[^\w ]/g, "")}"; } }`}</style>
      <PrintBar auto={o.auto} title={fileTitle} back="/admin/pendaftar/laporan" />
      <main className="rpt">
        <section className="cover">
          <div className="cover-mark"><Logo size={72} alt="" className="h-[18mm] w-[18mm]" /></div>
          <p className="cover-kicker">Laporan pendaftar anggota</p>
          <h1>{s.full_name || s.name}</h1>
          <p className="cover-org">{nf.format(total)} pendaftar · {o.view === "detail" ? "tampilan rinci per orang" : "tampilan rekap"}</p>

          <div className="toc">
            <h2>Isi laporan</h2>
            <ol>
              {sections.map((t, i) => <li key={t}><span className="n">{String(i + 1).padStart(2, "0")}</span>{t}</li>)}
            </ol>
          </div>
          <div className="toc">
            <h2>Cakupan data</h2>
            <p className="prose" style={{ fontSize: "10pt", color: "#424245" }}>{filters.length ? filters.join(" · ") : "Seluruh pendaftar, semua status, semua periode."}{o.group !== "none" ? ` Dikelompokkan menurut ${GROUP_LABEL[o.group]}.` : ""}</p>
          </div>

          <dl className="cover-meta">
            <dt>Dibuat pada</dt><dd>{stamp}</dd>
            <dt>Dibuat oleh</dt><dd>{email}</dd>
            <dt>Jumlah data</dt><dd>{nf.format(total)} dari {nf.format(all.length)} pendaftar tercatat</dd>
            <dt>Sumber</dt><dd>Database {s.name} (Supabase)</dd>
          </dl>
        </section>

        {total === 0 && <section className="sec"><p className="empty">Tidak ada pendaftar yang cocok dengan penyaringan ini.</p></section>}

        {o.stats && total > 0 && (
          <section className="sec pg">
            <div className="sec-head"><span className="n">01</span><h2>Ringkasan statistik</h2><span className="c">{nf.format(total)} pendaftar</span></div>
            <div className="kpis k4">
              <div><b>{nf.format(total)}</b><span>Total pendaftar</span></div>
              <div><b>{nf.format(count("baru"))}</b><span>Baru</span></div>
              <div><b>{nf.format(count("diterima"))}</b><span>Diterima</span></div>
              <div><b>{Math.round((withProof / total) * 100)}%</b><span>Melampirkan bukti follow</span></div>
            </div>
            {hasFee && (
              <div className="kpis k4">
                <div><b>{rupiah(feeSum)}</b><span>Total HTM masuk</span></div>
                <div><b>{nf.format(payers.length)}</b><span>Pendaftar membayar HTM</span></div>
                <div><b>{rupiah(Math.round(feeSum / payers.length))}</b><span>Rata-rata per pendaftar</span></div>
                <div><b>{Math.round((payers.length / total) * 100)}%</b><span>Dari seluruh pendaftar</span></div>
              </div>
            )}
            <Bars title="Menurut status" first="Status" rows={statusRows} total={total} />
            <Bars title="Menurut desa asal" first="Desa" rows={topN(tally((r) => cVillage(r.village)))} total={total} />
            <Bars title="Menurut kampus" first="Kampus" rows={topN(tally((r) => cCampus(r.campus)))} total={total} />
            <Bars title="Menurut angkatan" first="Angkatan" rows={tally((r) => cBatch(r.batch)).sort((a, b) => a[0] === EMPTY ? 1 : b[0] === EMPTY ? -1 : a[0].localeCompare(b[0], "id", { numeric: true }))} total={total} />
            {monthRows.length > 1 && <Bars title="Pendaftaran per bulan" first="Bulan" rows={monthRows} total={total} />}
          </section>
        )}

        {total > 0 && (
          <section className="sec pg">
            <div className="sec-head"><span className="n">{listNo}</span><h2>Daftar pendaftar</h2><span className="c">{nf.format(total)} data</span></div>

            {groups.map((g) => (
              <div key={g.name || "all"} className="grp">
                {o.group !== "none" && <h3 className="grp-h">{g.name}<span>{g.items.length} orang</span></h3>}

                {o.view === "rekap" ? (
                  <table className="rek">
                    <thead>
                      <tr>
                        <th className="num">No</th><th>Nama</th><th>Kampus &amp; angkatan</th><th>Desa asal</th>{o.contact && <th>Kontak</th>}
                        <th style={{ whiteSpace: "nowrap" }}>Terdaftar</th>
                      </tr>
                    </thead>
                    {g.items.map((r) => {
                      n += 1;
                      return (
                        <tbody key={r.id} className="one">
                          <tr>
                            <td className="num">{n}</td>
                            <td><b>{r.full_name}</b> <span className={`tag ${r.status === "baru" || r.status === "diterima" ? "" : "gray"}`}>{STATUS[r.status] ?? r.status}</span>{(r.fee_amount ?? 0) > 0 && <div className="muted">HTM {rupiah(r.fee_amount ?? 0)}{r.payment_proof ? " · bukti terlampir" : ""}</div>}</td>
                            <td>{[cCampus(r.campus), r.major].filter((x) => x && x !== EMPTY).join(" · ") || "—"}{r.batch ? <div className="muted">Angkatan {cBatch(r.batch)}</div> : null}</td>
                            <td>{r.village ? cVillage(r.village) : "—"}</td>
                            {o.contact && <td>{r.phone}{r.email ? <div className="muted">{r.email}</div> : null}</td>}
                            <td style={{ whiteSpace: "nowrap" }}>{fmtD(r.created_at)}</td>
                          </tr>
                          {((o.reason && r.message) || (o.notes && r.note)) && (
                            <tr className="why">
                              <td />
                              <td colSpan={cols + 1}>
                                {o.reason && r.message && <p><b>Alasan bergabung</b>{r.message}</p>}
                                {o.notes && r.note && <p><b>Catatan pengurus</b>{r.note}</p>}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    })}
                  </table>
                ) : (
                  g.items.map((r) => {
                    n += 1;
                    const showProof = o.proofs && !!r.follow_proof;
                    return (
                      <article className="item" key={r.id}>
                        <div className={`reg ${showProof ? "" : "no-proof"}`}>
                          <div>
                            <h4><span style={{ color: "#86868b", fontWeight: 500 }}>{String(n).padStart(3, "0")}</span>{r.full_name}<span className={`tag ${r.status === "baru" || r.status === "diterima" ? "" : "gray"}`}>{STATUS[r.status] ?? r.status}</span></h4>
                            <dl>
                              <dt>Terdaftar</dt><dd>{fmtDT(r.created_at)}</dd>
                              {o.contact && <><dt>WhatsApp</dt><dd>{r.phone}</dd><dt>Email</dt><dd>{r.email || "—"}</dd></>}
                              <dt>Kampus</dt><dd>{[cCampus(r.campus), r.major].filter((x) => x && x !== EMPTY).join(" · ") || "—"}{r.batch ? ` (angkatan ${cBatch(r.batch)})` : ""}</dd>
                              <dt>Desa asal</dt><dd>{r.village ? cVillage(r.village) : "—"}</dd>
                              <dt>Bukti follow</dt><dd>{r.follow_proof ? (o.proofs ? "Terlampir" : "Ada (tidak dicetak)") : "Tidak ada / sudah dihapus"}</dd>
                              {(r.fee_amount ?? 0) > 0 && <><dt>HTM</dt><dd>{rupiah(r.fee_amount ?? 0)}{r.payment_proof ? " · bukti bayar tersimpan" : ""}</dd></>}
                            </dl>
                            {o.reason && r.message && <p className="reason"><b>Alasan bergabung</b>{r.message}</p>}
                            {o.notes && r.note && <p className="reason"><b>Catatan pengurus</b>{r.note}</p>}
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
                  })
                )}
              </div>
            ))}
          </section>
        )}

        <div className="end">
        {o.sign && total > 0 && (
          <section className="sign">
            <p>Demikian laporan ini dibuat sebagai arsip resmi pendaftaran anggota {s.name}. Tanggal {stamp}.</p>
            <div>
              <div><span>Mengetahui,</span><b>Ketua Umum</b><i /><small>Nama &amp; tanda tangan</small></div>
              <div><span>Dibuat oleh,</span><b>Sekretaris</b><i /><small>Nama &amp; tanda tangan</small></div>
            </div>
          </section>
        )}

        <p className="colophon">Dokumen ini dibuat otomatis dari database {s.name} pada {stamp} oleh {email}. Berisi data pribadi pendaftar{o.contact ? " (termasuk kontak)" : ""}: simpan di tempat aman dan jangan disebarkan.</p>
        </div>
      </main>
    </div>
  );
}
