"use client";

import Photo from "@/components/ui/Photo";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/types";
import NewsRow, { fmtDate } from "@/components/news/NewsRow";
import Pagination, { usePaged } from "@/components/ui/Pagination";

const PAGE = 8; // berita per halaman (kartu utama hanya di halaman 1)

export default function BeritaIndex({ articles }: { articles: Article[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))], [articles]);
  const filtering = q.trim() !== "" || cat !== "Semua";
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return articles.filter((a) => (cat === "Semua" || a.category === cat) && (!needle || `${a.title} ${a.excerpt} ${a.author}`.toLowerCase().includes(needle)));
  }, [articles, q, cat]);

  const leadItem = !filtering ? list[0] : undefined;
  const rest = leadItem ? list.slice(1) : list;
  const anchor = useRef<HTMLDivElement>(null);
  const p = usePaged(rest.length, PAGE, anchor);
  const lead = p.page === 1 ? leadItem : undefined; // kartu utama hanya di halaman pertama
  const visible = rest.slice(p.start, p.end);

  return (
    <>
      {/* Kontrol: tab kategori bergaris bawah + pencarian */}
      <div className="flex flex-col gap-4 border-b border-black/10 md:flex-row md:items-end md:justify-between">
        <div className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filter kategori">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCat(c); p.reset(); }}
              aria-pressed={cat === c}
              className={`h-12 shrink-0 border-b-2 px-4 text-[15px] font-semibold transition-colors ${cat === c ? "border-accent text-primary-dark" : "border-transparent text-neutral-500 hover:text-primary-dark"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative pb-3 md:w-72 md:pb-2">
          <Search size={17} className="absolute left-3.5 top-[calc(50%-6px)] -translate-y-1/2 text-neutral-400 md:top-[calc(50%-4px)]" />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); p.reset(); }}
            placeholder="Cari berita"
            aria-label="Cari berita"
            className="h-11 w-full rounded-full bg-black/[0.045] pl-10 pr-4 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-24 text-center text-neutral-400">Tidak ada berita yang cocok.</p>
      ) : (
        <>
          {lead && (
            <Link href={`/berita/${lead.slug}`} className="group relative mt-8 block overflow-hidden rounded-[1.75rem] bg-primary-dark sm:mt-10">
              <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
                {lead.cover_image ? (
                  <Photo src={lead.cover_image} alt="" priority sizes="(max-width: 1280px) 100vw, 1200px" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-dark via-accent to-accent-light" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#061431]/90 via-[#061431]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/80">
                    {lead.category && <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">{lead.category}</span>}
                    <time dateTime={lead.published_at ?? undefined}>{fmtDate(lead.published_at)}</time>
                  </p>
                  <h2 className="mt-4 max-w-3xl text-[1.65rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">{lead.title}</h2>
                  {lead.excerpt && <p className="mt-3 hidden max-w-2xl text-[16px] leading-relaxed text-white/75 sm:line-clamp-2 sm:block">{lead.excerpt}</p>}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">Baca berita <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </div>
              </div>
            </Link>
          )}

          {visible.length > 0 && (
            <div className="mt-10 scroll-mt-28 sm:mt-14" ref={anchor}>
              {leadItem && <h2 className="mb-1 text-xl font-extrabold tracking-tight text-primary-dark sm:text-2xl">{p.page === 1 ? "Berita lainnya" : "Berita sebelumnya"}</h2>}
              <ul className="grid border-t border-black/10 lg:grid-cols-2 lg:gap-x-16">
                {visible.map((a) => (
                  <li key={a.id} className="border-b border-black/10">
                    <NewsRow a={a} />
                  </li>
                ))}
              </ul>
              <Pagination page={p.page} pages={p.pages} total={rest.length} size={PAGE} onChange={p.go} noun="berita" />
            </div>
          )}
        </>
      )}
    </>
  );
}
