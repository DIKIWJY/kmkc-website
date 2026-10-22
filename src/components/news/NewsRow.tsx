import Link from "next/link";
import Photo from "@/components/ui/Photo";
import type { Article } from "@/lib/types";

export const fmtDate = (d: string | null) =>
  d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

/** Baris berita bergaya media: teks di kiri, foto kecil di kanan, dipisah garis tipis (bukan kotak). */
export default function NewsRow({ a, showExcerpt = true }: { a: Article; showExcerpt?: boolean }) {
  return (
    <Link href={`/berita/${a.slug}`} className="group flex items-start gap-5 py-6 sm:gap-7">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-3 text-[12.5px]">
          {a.category && <span className="font-semibold uppercase tracking-[0.08em] text-accent">{a.category}</span>}
          <time className="text-neutral-400" dateTime={a.published_at ?? undefined}>{fmtDate(a.published_at)}</time>
        </p>
        <h3 className="mt-2 text-[1.12rem] font-bold leading-snug tracking-tight text-primary-dark transition-colors group-hover:text-accent sm:text-[1.3rem]">{a.title}</h3>
        {showExcerpt && a.excerpt && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-neutral-500">{a.excerpt}</p>}
      </div>
      <div className="relative mt-1 h-[84px] w-[112px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-accent-dark to-accent-light sm:h-[104px] sm:w-[150px]">
        {a.cover_image && <Photo src={a.cover_image} alt="" sizes="150px" className="transition-transform duration-500 group-hover:scale-105" />}
      </div>
    </Link>
  );
}
