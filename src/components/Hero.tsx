import { ArrowRight, ArrowDownRight } from "lucide-react";
import PhotoStrip from "@/components/PhotoStrip";
import CempakaMark from "@/components/ui/CempakaMark";
import { formatDateID } from "@/lib/date";
import type { StatItem } from "@/lib/types";

interface HeroProps {
  name: string;
  fullName: string;
  tagline: string;
  stats: StatItem[];
  photos: string[];
  /** Agenda terdekat (opsional) — tampil sebagai baris kecil di bawah tombol. */
  nextEvent?: { title: string; date: string } | null;
}

/**
 * Hero tipografis: "KMKC" raksasa naik huruf per huruf, ornamen garis bunga cempaka
 * (lambang daerah) sebagai latar, tanpa kartu/kotak. Logo sudah ada di navbar, jadi tidak diulang di sini.
 * Semua latar statis (gradien) → ringan di HP.
 */
export default function Hero({ name, fullName, tagline, stats, photos, nextEvent }: HeroProps) {
  const letters = [...name];
  return (
    <section className="relative isolate min-h-[100svh] flex flex-col overflow-hidden bg-[#050f26] pt-28 sm:pt-32 pb-10">
      {/* latar: gradien statis (tanpa pola kotak) */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(70%_60%_at_85%_35%,rgba(20,90,190,.55),transparent_70%),radial-gradient(55%_50%_at_5%_100%,rgba(6,110,150,.5),transparent_70%)]" />
      <CempakaMark className="flower-spin absolute -z-10 text-sky-200 w-[44rem] max-w-none -right-60 top-24 opacity-70 sm:w-[56rem] sm:-right-72 sm:top-10 lg:w-[72rem] lg:-right-80 lg:-top-6 [mask-image:linear-gradient(to_left,#000_30%,transparent_92%)]" />

      <div className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex items-center gap-4 text-[11px] sm:text-xs font-semibold tracking-[0.24em] uppercase text-sky-200/80">
          <span className="hero-line block h-px w-12 sm:w-20 bg-sky-300/70" />
          <span className="animate-fade-in-up">{fullName}</span>
        </div>

        <h1 aria-label={`${name} — ${fullName}`} className="mt-5 sm:mt-6 font-extrabold tracking-[-0.045em] leading-[0.84] text-[clamp(5rem,26vw,8.5rem)] sm:text-[clamp(8rem,22vw,19rem)] select-none">
          {letters.map((c, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden align-top pb-[0.08em] pr-[0.015em]">
              <span
                className="hero-letter inline-block bg-clip-text text-transparent bg-[linear-gradient(180deg,#ffffff_8%,#bfe6ff_46%,#38bdf8_100%)]"
                style={{ animationDelay: `${0.12 + i * 0.09}s` }}
              >
                {c}
              </span>
            </span>
          ))}
        </h1>

        <p className="animate-fade-in-up mt-6 sm:mt-8 max-w-2xl text-xl sm:text-2xl lg:text-[1.65rem] font-light leading-snug text-white/80" style={{ animationDelay: "0.55s" }}>
          {tagline}
        </p>

        <div className="animate-fade-in-up mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: "0.7s" }}>
          <a
            href="/daftar"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-white pl-7 pr-6 text-sm font-bold text-[#0b2a63] shadow-[0_12px_40px_-10px_rgba(56,189,248,.6)] transition hover:bg-sky-100"
          >
            Gabung jadi anggota
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#gallery" className="group inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white transition-colors">
            <span className="border-b border-white/30 pb-0.5 group-hover:border-sky-300 transition-colors">Lihat kegiatan kami</span>
            <ArrowDownRight size={16} className="text-sky-300" />
          </a>
        </div>

        {nextEvent && (
          <a href="#agenda" className="animate-fade-in-up mt-8 inline-flex w-fit max-w-full items-center gap-3 text-sm text-white/65 hover:text-white transition-colors" style={{ animationDelay: "0.85s" }}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
            </span>
            <span className="truncate">
              <b className="font-semibold text-white/90">Agenda berikutnya</b> · {nextEvent.title} · {formatDateID(nextEvent.date, { day: "numeric", month: "short" })}
            </span>
          </a>
        )}

        {stats.length > 0 && (
          <dl className="animate-fade-in-up mt-10 sm:mt-12 flex max-w-3xl border-t border-white/12 pt-6" style={{ animationDelay: "0.95s" }}>
            {stats.map((s) => (
              <div key={s.label} className="flex-1 min-w-0 flex flex-col-reverse border-l border-white/12 pl-4 sm:pl-7 first:border-l-0 first:pl-0">
                <dt className="mt-1.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] text-white/60">{s.label}</dt>
                <dd className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <PhotoStrip photos={photos} />

      {photos.length < 3 && (
        <a href="#about" aria-label="Gulir ke bawah" className="relative z-10 mx-auto mt-10 block h-14 w-px bg-white/15 overflow-hidden">
          <span className="scroll-cue block h-full w-full bg-sky-300" />
        </a>
      )}
    </section>
  );
}
