import Photo from "@/components/ui/Photo";
import Link from "next/link";
import { ArrowUpRight, Clock, ImageIcon } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Article } from "@/lib/types";

interface BeritaProps {
  articles: Article[];
  page?: boolean;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const gradients = [
  "linear-gradient(135deg,#1d4ed8,#0ea5e9)",
  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
  "linear-gradient(135deg,#0284c7,#38bdf8)",
];

export default function Berita({ articles, page }: BeritaProps) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading title="Berita & Artikel" subtitle="Cerita dan informasi terbaru dari kegiatan kami." className="mb-14" page={page} href="/berita" hrefLabel="Semua berita" />

        <div className="grid lg:grid-cols-5 gap-8">
          {/* featured */}
          <Link href={`/berita/${featured.slug}`} data-a="up" className="lg:col-span-3 group cursor-pointer block">
            <div className="relative aspect-[16/10] rounded-[1.4rem] overflow-hidden mb-5 shadow-[0_20px_50px_-20px_rgba(30,79,163,0.4)]">
              {featured.cover_image ? (
                <Photo src={featured.cover_image} alt={featured.title} sizes="(max-width: 1024px) 100vw, 600px" className="group-hover:scale-[1.03] transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: gradients[0] }}>
                  <div className="flex flex-col items-center gap-1.5 text-white/85">
                    <ImageIcon size={26} />
                    <span className="text-xs font-semibold uppercase tracking-wide">{featured.category}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-semibold text-gradient uppercase tracking-wide">{featured.category}</span>
              <span className="text-[11px] text-muted flex items-center gap-1"><Clock size={10} />{formatDate(featured.published_at)}</span>
            </div>
            <h3 className="text-xl font-bold text-primary-dark leading-snug group-hover:text-accent transition-colors mb-2">{featured.title}</h3>
            <p className="text-sm text-muted leading-relaxed line-clamp-2">{featured.excerpt}</p>
          </Link>

          {/* side list */}
          <div data-a="up" className="lg:col-span-2 flex flex-col divide-y divide-border">
            {rest.map((article, i) => (
              <Link key={article.id} href={`/berita/${article.slug}`} className="group flex gap-4 items-start py-4 first:pt-0 cursor-pointer">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  {article.cover_image ? (
                    <Photo src={article.cover_image} alt={article.title} sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: gradients[(i + 1) % gradients.length] }}>
                      <ImageIcon size={18} className="text-white/85" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-gradient uppercase tracking-wide">{article.category}</span>
                  <h4 className="text-sm font-semibold text-primary-dark leading-snug mt-0.5 group-hover:text-accent transition-colors line-clamp-2">{article.title}</h4>
                  <p className="text-xs text-muted mt-1">{formatDate(article.published_at)}</p>
                </div>
                <ArrowUpRight size={14} className="text-accent shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/berita" className="inline-flex items-center gap-2 rounded-full bg-brand-gradient text-white text-sm font-bold px-7 py-3.5 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition">
            Lihat semua berita <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
