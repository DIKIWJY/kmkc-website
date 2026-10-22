"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DayStat } from "@/lib/admin/stats";

const RANGES = [7, 30, 90] as const;
const nf = new Intl.NumberFormat("id-ID");
const shortDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const longDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Kurva halus monoton (Fritsch–Carlson) → path cubic bezier. */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / dx[i]); }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const s = dx[i] / 3;
    d += ` C${pts[i][0] + s},${pts[i][1] + t[i] * s} ${pts[i + 1][0] - s},${pts[i + 1][1] - t[i + 1] * s} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (p / 2)) * (p / 2);
};

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur === 0) return <span className="text-[13px] text-[var(--ad-faint)]">belum ada data</span>;
  if (prev === 0) return <span className="text-[13px] font-medium text-[var(--ad-blue)]">baru</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[13px] font-medium ${pct > 0 ? "text-[var(--ad-blue)]" : "text-[var(--ad-mute)]"}`}>
      <Icon size={13} /> {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
}

export default function TrafficPanel({ daily }: { daily: DayStat[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  const { cur, prev } = useMemo(() => ({ cur: daily.slice(-range), prev: daily.slice(-range * 2, -range) }), [daily, range]);
  const sum = (l: DayStat[], k: "views" | "visitors") => l.reduce((a, d) => a + d[k], 0);
  const views = sum(cur, "views"), visitors = sum(cur, "visitors");

  const max = niceMax(Math.max(1, ...cur.map((d) => d.views)));
  const n = cur.length;
  const X = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const Y = (v: number) => 100 - (v / max) * 100;
  const vPts = cur.map((d, i) => [X(i), Y(d.views)] as [number, number]);
  const uPts = cur.map((d, i) => [X(i), Y(d.visitors)] as [number, number]);
  const line = smooth(vPts);
  const area = `${line} L100,100 L0,100 Z`;
  const active = hover === null ? null : cur[hover];
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((max / 4) * (4 - i)));
  const xLabels = useMemo(() => {
    const step = Math.max(1, Math.round(n / 6));
    return cur.map((d, i) => ({ i, d })).filter(({ i }) => (n - 1 - i) % step === 0);
  }, [cur, n]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(f * (n - 1)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="flex gap-8 sm:gap-10">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--ad-mute)]"><span className="h-0.5 w-3 rounded bg-[#0071e3]" />Tampilan halaman</p>
            <p className="mt-1 text-[30px] font-semibold leading-tight tracking-tight tnum">{nf.format(views)}</p>
            <Delta cur={views} prev={sum(prev, "views")} />
          </div>
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--ad-mute)]"><span className="h-0.5 w-3 rounded bg-[#5ac8fa]" />Pengunjung</p>
            <p className="mt-1 text-[30px] font-semibold leading-tight tracking-tight tnum">{nf.format(visitors)}</p>
            <Delta cur={visitors} prev={sum(prev, "visitors")} />
          </div>
        </div>
        <div role="tablist" aria-label="Rentang waktu" className="ad-seg">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => { setRange(r); setHover(null); }}
              className=""
            >
              {r} hari
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative h-52 sm:h-60 w-8 shrink-0 text-[11px] text-[var(--ad-faint)] tnum" aria-hidden>
          {ticks.map((t, i) => <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${i * 25}%` }}>{t >= 1000 ? `${t / 1000}k` : t}</span>)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-52 sm:h-60 touch-pan-y" onPointerMove={onMove} onPointerLeave={() => setHover(null)} onPointerDown={onMove}>
            {ticks.map((_, i) => <div key={i} className="absolute inset-x-0 border-t border-[var(--ad-line)]" style={{ top: `${i * 25}%` }} />)}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" role="img" aria-label={`Grafik tampilan halaman ${range} hari terakhir`}>
              <defs>
                <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#g${gid})`} />
              <path d={smooth(uPts)} fill="none" stroke="#5ac8fa" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              <path d={line} fill="none" stroke="#0071e3" strokeWidth="2.25" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              {active && <line x1={X(hover!)} x2={X(hover!)} y1="0" y2="100" stroke="#1d1d1f" strokeOpacity="0.25" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
            </svg>
            {active && (
              <>
                <span className="absolute w-3 h-3 rounded-full bg-[#0071e3] ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${X(hover!)}%`, top: `${Y(active.views)}%` }} />
                <span className="absolute w-3 h-3 rounded-full bg-[#5ac8fa] ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${X(hover!)}%`, top: `${Y(active.visitors)}%` }} />
                <div
                  className="absolute top-0 z-10 pointer-events-none rounded-[10px] bg-[rgba(29,29,31,0.94)] text-white text-[12.5px] px-3 py-2 shadow-xl whitespace-nowrap backdrop-blur"
                  style={{ left: `${X(hover!)}%`, transform: `translateX(${X(hover!) > 70 ? "calc(-100% - 12px)" : "12px"})` }}
                >
                  <p className="font-semibold">{longDate(active.day)}</p>
                  <p className="mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4da3ff]" />{nf.format(active.views)} tampilan</p>
                  <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#5ac8fa]" />{nf.format(active.visitors)} pengunjung</p>
                </div>
              </>
            )}
          </div>
          <div className="relative h-5 mt-2 text-[11px] text-[var(--ad-faint)]" aria-hidden>
            {xLabels.map(({ i, d }) => (
              <span key={d.day} className="absolute whitespace-nowrap" style={{ left: `${X(i)}%`, transform: i === n - 1 ? "translateX(-100%)" : i === 0 ? "none" : "translateX(-50%)" }}>{shortDate(d.day)}</span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Statistik harian {range} hari terakhir</caption>
        <thead><tr><th>Tanggal</th><th>Tampilan</th><th>Pengunjung</th></tr></thead>
        <tbody>{cur.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.views}</td><td>{d.visitors}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
