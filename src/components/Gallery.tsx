"use client";

import Link from "next/link";
import Photo from "@/components/ui/Photo";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ImageIcon, ArrowRight } from "lucide-react";
import Pagination, { usePaged } from "@/components/ui/Pagination";
import type { GalleryItem } from "@/lib/types";

const GRID = 12; // foto per halaman pada kisi galeri

interface GalleryProps {
  items: GalleryItem[];
  page?: boolean;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/* Filter seperti BNCC (All / Event / Activity) */
const filters = [
  { key: "all", label: "Semua" },
  { key: "Acara", label: "Acara" },
  { key: "Kegiatan", label: "Kegiatan" },
];

/* Placeholder tiles sampai foto asli diunggah lewat admin panel */
const tones = [
  ["#1b4799", "#2f7fd8"],
  ["#0f2a5c", "#2563eb"],
  ["#1e6fd9", "#4ea8ff"],
  ["#0c4a8a", "#0ea5e9"],
  ["#173f86", "#3b82f6"],
  ["#1d4ed8", "#38bdf8"],
];
const ratios = ["aspect-[4/3]", "aspect-[16/11]", "aspect-[4/3.6]", "aspect-[3/2]", "aspect-[4/3.3]", "aspect-[16/10]"];

function tileBackground(i: number) {
  const [a, b] = tones[i % tones.length];
  return {
    background: `radial-gradient(circle at ${20 + ((i * 23) % 60)}% ${15 + ((i * 17) % 40)}%, rgba(255,255,255,0.26) 0%, transparent 45%), linear-gradient(145deg, ${a}, ${b})`,
  };
}

function Tile({ item, index, className = "" }: { item: GalleryItem; index: number; className?: string }) {
  return item.image_url ? (
    <span className="relative block w-full h-full">
      <Photo src={item.image_url} alt={item.title} sizes="(max-width: 768px) 75vw, 420px" className={className} />
    </span>
  ) : (
    <div className={`w-full h-full flex items-center justify-center ${className}`} style={tileBackground(index)}>
      <ImageIcon size={30} className="text-white/35" />
    </div>
  );
}

export default function Gallery({ items, page }: GalleryProps) {
  const Heading = page ? "h1" : "h2";
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const list = useMemo(
    () => (filter === "all" ? items : items.filter((g) => g.category === filter)),
    [items, filter]
  );
  const n = list.length;
  const gridTop = useRef<HTMLDivElement>(null);
  const pg = usePaged(n, GRID, gridTop);
  // Coverflow: bila admin menandai ≥3 foto "Sorotan", hanya itu yang diputar; jika tidak, kegiatan terbaru (maks. 12).
  const deck = useMemo(() => {
    const spot = list.filter((g) => g.featured);
    return (spot.length >= 3 ? spot : list).slice(0, 12);
  }, [list]);
  const nd = deck.length;

  const go = useCallback((dir: number) => setActive((a) => (nd ? (a + dir + nd) % nd : 0)), [nd]);

  // autoplay coverflow — hanya berjalan saat galeri terlihat di layar (hemat CPU/baterai)
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || paused || selected !== null || nd < 2) return;
    const t = setInterval(() => go(1), 4200);
    return () => clearInterval(t);
  }, [visible, paused, selected, nd, go]);

  // lightbox keys
  const close = useCallback(() => setSelected(null), []);
  const lbNext = useCallback(() => setSelected((s) => (s === null ? s : (s + 1) % n)), [n]);
  const lbPrev = useCallback(() => setSelected((s) => (s === null ? s : (s - 1 + n) % n)), [n]);
  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "ArrowLeft") lbPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close, lbNext, lbPrev]);

  const current = selected !== null ? list[selected] : null;

  /* jarak melingkar terpendek dari slide aktif */
  const dist = (i: number) => {
    let d = i - active;
    if (d > nd / 2) d -= nd;
    if (d < -nd / 2) d += nd;
    return d;
  };

  if (items.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 overflow-x-clip">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        {/* heading tengah */}
        <div data-a="up" className="text-center max-w-2xl mx-auto mb-10">
          <Heading className="text-4xl sm:text-5xl font-extrabold">
            <span className="text-neutral-900">Galeri </span>
            <span className="text-gradient">Kegiatan</span>
          </Heading>
          <p className="text-neutral-500 text-lg mt-4 leading-relaxed">
            Momen-momen terbaik dari acara dan kegiatan komunitas kami.
          </p>
          {!page && (
            <Link href="/galeri" className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary transition-colors">
              Lihat semua foto <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* filter pill */}
        <div data-a="up" className="flex justify-center mb-14">
          <div className="inline-flex p-1.5 rounded-full bg-white shadow-[0_6px_24px_-8px_rgba(30,79,163,0.3)] ring-1 ring-black/5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setActive(0); pg.reset(); }}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                  filter === f.key ? "bg-primary text-white shadow-md" : "text-neutral-500 hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* coverflow */}
        <div
          data-a="up" className="relative h-[240px] sm:h-[340px] lg:h-[400px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {deck.map((item, i) => {
            const d = dist(i);
            const abs = Math.abs(d);
            const visible = abs <= 2;
            const x = d === 0 ? 0 : Math.sign(d) * (abs === 1 ? 66 : 104);
            const scale = abs === 0 ? 1 : abs === 1 ? 0.84 : 0.66;
            return (
              <button
                key={item.id}
                onClick={() => (d === 0 ? setSelected(list.indexOf(item)) : setActive(i))}
                aria-label={item.title}
                className="absolute left-1/2 top-1/2 w-[64%] sm:w-[46%] lg:w-[40%] aspect-[5/3] rounded-[1.1rem] overflow-hidden shadow-[0_24px_60px_-18px_rgba(15,42,92,0.55)] transition-all duration-700 ease-[cubic-bezier(.22,.8,.3,1)]"
                style={{
                  transform: `translate(calc(-50% + ${x}%), -50%) scale(${scale})`,
                  zIndex: 10 - abs,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? "auto" : "none",
                  cursor: d === 0 ? "zoom-in" : "pointer",
                }}
              >
                <Tile item={item} index={i} />
                <span
                  className="absolute inset-0 bg-white transition-opacity duration-700"
                  style={{ opacity: abs === 0 ? 0 : abs === 1 ? 0.28 : 0.5 }}
                />
              </button>
            );
          })}

          <button
            onClick={() => go(-1)}
            aria-label="Sebelumnya"
            className="absolute left-0 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(15,42,92,0.35)] flex items-center justify-center text-primary hover:scale-110 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Berikutnya"
            className="absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(15,42,92,0.35)] flex items-center justify-center text-primary hover:scale-110 transition-transform"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* dots */}
        <div className="flex flex-wrap justify-center items-center mt-8 mb-14">
          {deck.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="group/dot h-6 min-w-6 px-0 flex items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-500 ${
                  i === active ? "w-8 bg-primary" : "w-2 bg-primary/25 group-hover/dot:bg-primary/50"
                }`}
              />
            </button>
          ))}
        </div>

        {/* grid 3 kolom, dibagi per halaman */}
        <div ref={gridTop} className="scroll-mt-28" />
        <div data-stagger="70" className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5">
          {list.slice(pg.start, pg.end).map((item, k) => {
            const i = pg.start + k; // indeks sebenarnya di seluruh daftar (untuk lightbox & warna cadangan)
            return (
            <button
              key={item.id}
              onClick={() => setSelected(i)}
              data-a="zoom" data-cursor="Lihat" className="gallery-item relative block w-full break-inside-avoid cursor-zoom-in"
              aria-label={`Buka foto: ${item.title}`}
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-auto block" loading="lazy" />
              ) : (
                <div className={`w-full ${ratios[i % ratios.length]}`} style={tileBackground(i)}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={28} className="text-white/35" />
                  </div>
                </div>
              )}
            </button>
            );
          })}
        </div>
        <Pagination page={pg.page} pages={pg.pages} total={n} size={GRID} onChange={pg.go} noun="foto" />
      </div>

      {current && selected !== null && (
        <div className="fixed inset-0 z-[60] bg-[#030b1f]/95 backdrop-blur-sm flex flex-col animate-fade-in" onClick={close}>
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 text-white/70" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm tabular-nums">{selected + 1} / {n}</span>
            <button onClick={close} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Tutup">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16 relative">
            <button onClick={(e) => { e.stopPropagation(); lbPrev(); }} className="absolute left-2 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Sebelumnya">
              <ChevronLeft size={24} />
            </button>
            <div className="w-full max-w-4xl max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {current.image_url ? (
                <img src={current.image_url} alt={current.title} className="max-h-[68vh] w-auto rounded-2xl object-contain shadow-2xl" />
              ) : (
                <div className="w-full aspect-[16/10] max-h-[68vh] rounded-2xl shadow-2xl flex items-center justify-center" style={tileBackground(selected)}>
                  <span className="text-white/70 text-sm">Foto belum tersedia</span>
                </div>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); lbNext(); }} className="absolute right-2 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Berikutnya">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="px-6 py-6 text-center text-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold">{current.title}</h3>
            <p className="text-white/55 text-sm mt-1 max-w-xl mx-auto">{current.description}</p>
            <p className="text-white/35 text-xs mt-2">{formatDate(current.event_date)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
