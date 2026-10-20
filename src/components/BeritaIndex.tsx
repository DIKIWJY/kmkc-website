"use client";

import Photo from "@/components/ui/Photo";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ImageIcon, Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/types";

const fmt = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");

const gradients = [
  "linear-gradient(135deg,#1d4ed8,#0ea5e9)",
  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
  "linear-gradient(135deg,#1e4fa3,#4ea8ff)",
];

export default function BeritaIndex({ articles }: { articles: Article[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))], [articles]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return articles.filter(
      (a) => (cat === "Semua" || a.category === cat) && (!needle || `${a.title} ${a.excerpt} ${a.author}`.toLowerCase().includes(needle))
    );
  }, [articles, q, cat]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
        <div className="relative flex-1 max-w-md">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari berita…"
            aria-label="Cari berita"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white ring-1 ring-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${cat === c ? "bg-brand-gradient text-white shadow-md shadow-blue-500/25" : "bg-white ring-1 ring-border text-neutral-600 hover:text-primary"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-neutral-400 py-20">Tidak ada berita yang cocok.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {list.map((a, i) => (
            <Link key={a.id} href={`/berita/${a.slug}`} className="group soft-card overflow-hidden flex flex-col">
              <div className="relative aspect-[16/10] overflow-hidden">
                {a.cover_image ? (
                  <Photo src={a.cover_image} alt="" sizes="(max-width: 768px) 100vw, 380px" className="group-hover:scale-[1.04] transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: gradients[i % gradients.length] }}>
                    <ImageIcon size={28} className="text-white/70" />
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-2.5 text-[11px]">
                  <span className="font-bold uppercase tracking-wide text-accent">{a.category}</span>
                  <span className="text-neutral-400 inline-flex items-center gap-1"><Clock size={11} /> {fmt(a.published_at)}</span>
                </div>
                <h3 className="font-bold text-lg text-primary-dark leading-snug group-hover:text-accent transition-colors">{a.title}</h3>
                {a.excerpt && <p className="mt-2 text-sm text-neutral-500 leading-relaxed line-clamp-3">{a.excerpt}</p>}
                <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">Baca selengkapnya <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
