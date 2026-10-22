import Link from "next/link";
import { ArrowRight, ArrowDownRight } from "lucide-react";
import PhotoStrip from "@/components/PhotoStrip";
import CempakaMark from "@/components/ui/CempakaMark";
import Count from "@/components/ui/Count";
import { formatDateID } from "@/lib/date";
import type { StatItem } from "@/lib/types";
import type { CSSProperties } from "react";

interface HeroProps {
  name: string;
  fullName: string;
  tagline: string;
  stats: StatItem[];
  photos: string[];
  /** Agenda terdekat (opsional) — tampil sebagai baris kecil di bawah tombol. */
  nextEvent?: { title: string; date: string } | null;
}

/* Titik cahaya yang naik pelan (posisi tetap → tidak ada beda server/klien) */
const PARTICLES = [
  { x: "6%", s: 6, t: 15, dl: 0, dx: 30, o: 0.7 }, { x: "14%", s: 10, t: 21, dl: 4, dx: -20, o: 0.5 },
  { x: "23%", s: 5, t: 17, dl: 9, dx: 24, o: 0.8 }, { x: "31%", s: 8, t: 24, dl: 2, dx: -30, o: 0.55 },
  { x: "40%", s: 4, t: 14, dl: 7, dx: 16, o: 0.8 }, { x: "49%", s: 12, t: 26, dl: 11, dx: -26, o: 0.4 },
  { x: "57%", s: 6, t: 18, dl: 5, dx: 34, o: 0.7 }, { x: "66%", s: 9, t: 22, dl: 13, dx: -18, o: 0.5 },
  { x: "74%", s: 5, t: 16, dl: 1, dx: 22, o: 0.8 }, { x: "82%", s: 11, t: 25, dl: 8, dx: -34, o: 0.45 },
  { x: "90%", s: 6, t: 19, dl: 12, dx: 18, o: 0.7 }, { x: "96%", s: 8, t: 23, dl: 3, dx: -22, o: 0.55 },
];

/**
 * Hero tipografis: "KMKC" raksasa naik huruf per huruf (lalu berkilau pelan dan bereaksi saat disentuh),
 * garis bunga cempaka tergambar sendiri, titik cahaya naik, dan semuanya bergeser halus mengikuti kursor / scroll.
 * Tanpa kartu/kotak. Latar murni gradien + transform → ringan di HP.
 */
export default function Hero({ name, fullName, tagline, stats, photos, nextEvent }: HeroProps) {
  const letters = [...name];
  const d = (s: number) => ({ "--hd": `${s}s` }) as CSSProperties;
  return (
    <section data-hero className="relative isolate min-h-[100svh] flex flex-col overflow-hidden bg-[#050f26] pt-28 sm:pt-32 pb-10">
      {/* latar: gradien statis + dua cahaya yang bergerak pelan */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-[radial-gradient(70%_60%_at_85%_35%,rgba(20,90,190,.55),transparent_70%),radial-gradient(55%_50%_at_5%_100%,rgba(6,110,150,.5),transparent_70%)]" />
      <div aria-hidden className="blob-a absolute -z-20 -left-[10%] -top-[15%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgba(18,120,230,.30),transparent)]" />
      <div aria-hidden className="blob-b absolute -z-20 -right-[15%] top-[20%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(closest-side,rgba(14,200,240,.20),transparent)]" />
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span key={i} className="pt" style={{ "--x": p.x, "--s": `${p.s}px`, "--t": `${p.t}s`, "--dl": `-${p.dl}s`, "--dx": `${p.dx}px`, "--o": p.o } as CSSProperties} />
        ))}
      </div>

      <div className="hero-flower absolute -z-10 -right-60 top-24 w-[44rem] max-w-none sm:w-[56rem] sm:-right-72 sm:top-10 lg:w-[72rem] lg:-right-80 lg:-top-6" aria-hidden>
        <CempakaMark draw className="flower-spin w-full text-sky-200 opacity-70 [mask-image:linear-gradient(to_left,#000_30%,transparent_92%)]" />
      </div>

      <div className="hero-in relative z-10 flex-1 flex flex-col justify-center w-full max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex items-center gap-4 text-[11px] sm:text-xs font-semibold tracking-[0.24em] uppercase text-sky-200/80">
          <span className="hero-line block h-px w-12 sm:w-20 bg-sky-300/70" />
          <span className="hero-rise" style={d(0.3)}>{fullName}</span>
        </div>

        <h1 aria-label={`${name} — ${fullName}`} className="hero-title mt-5 sm:mt-6 font-extrabold tracking-[-0.045em] leading-[0.84] text-[clamp(5rem,26vw,8.5rem)] sm:text-[clamp(8rem,22vw,19rem)] select-none">
          {letters.map((c, i) => (
            <span key={i} aria-hidden className="hl">
              <span className="hero-letter" style={{ "--i": i } as CSSProperties}>{c}</span>
            </span>
          ))}
        </h1>

        <p className="hero-rise mt-6 sm:mt-8 max-w-2xl text-xl sm:text-2xl lg:text-[1.65rem] font-light leading-snug text-white/80" style={d(0.6)}>
          {tagline}
        </p>

        <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={d(0.75)}>
          <Link
            href="/daftar"
            data-magnetic
            data-cursor="Daftar"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-white pl-7 pr-6 text-sm font-bold text-[#0b2a63] shadow-[0_12px_40px_-10px_rgba(56,189,248,.6)] transition hover:bg-sky-100"
          >
            Gabung jadi anggota
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/galeri" data-magnetic className="group inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white transition-colors">
            <span className="border-b border-white/30 pb-0.5 group-hover:border-sky-300 transition-colors">Lihat kegiatan kami</span>
            <ArrowDownRight size={16} className="text-sky-300 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </Link>
        </div>

        {nextEvent && (
          <Link href="/agenda" className="hero-rise mt-8 inline-flex w-fit max-w-full items-center gap-3 text-sm text-white/65 hover:text-white transition-colors" style={d(0.9)}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
            </span>
            <span className="truncate">
              <b className="font-semibold text-white/90">Agenda berikutnya</b> · {nextEvent.title} · {formatDateID(nextEvent.date, { day: "numeric", month: "short" })}
            </span>
          </Link>
        )}

        {stats.length > 0 && (
          <dl className="hero-rise mt-10 sm:mt-12 flex max-w-3xl border-t border-white/12 pt-6" style={d(1.0)}>
            {stats.map((s) => (
              <div key={s.label} className="flex-1 min-w-0 flex flex-col-reverse border-l border-white/12 pl-4 sm:pl-7 first:border-l-0 first:pl-0">
                <dt className="mt-1.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] text-white/60">{s.label}</dt>
                <dd className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white"><Count value={s.value} /></dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <PhotoStrip photos={photos} />

      <div aria-hidden className="hero-rise relative z-10 mx-auto mt-10 flex flex-col items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45" style={d(1.3)}>
        Gulir
        <span className="block h-12 w-px overflow-hidden bg-white/15">
          <span className="scroll-cue block h-full w-full bg-sky-300" />
        </span>
      </div>
    </section>
  );
}
