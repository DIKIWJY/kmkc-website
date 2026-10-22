import Photo from "@/components/ui/Photo";
import Paged from "@/components/ui/Paged";
import { formatDateID } from "@/lib/date";
import type { GalleryItem } from "@/lib/types";

const PER_YEAR = 8;

function Figure({ g }: { g: GalleryItem }) {
  return (
    <figure className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-alt">
        <Photo
          src={g.image_url}
          alt={g.title}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="grayscale-[.55] transition duration-500 group-hover:grayscale-0 group-hover:scale-[1.04]"
        />
      </div>
      <figcaption className="mt-2.5">
        <p className="text-sm font-semibold text-primary-dark leading-snug line-clamp-2">{g.title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{formatDateID(g.event_date, { month: "long", year: "numeric" })}</p>
      </figcaption>
    </figure>
  );
}

/**
 * Arsip kegiatan lama: tanpa animasi, dikelompokkan per tahun.
 * Tahun besar di kiri, foto kecil di kanan; foto di luar 8 teratas dilipat dengan <details>; 3 tahun per halaman.
 */
export default function GalleryArchive({ years }: { years: { year: string; items: GalleryItem[] }[] }) {
  if (years.length === 0) return null;
  const total = years.reduce((a, y) => a + y.items.length, 0);

  return (
    <section aria-labelledby="arsip-judul" className="py-20 lg:py-28 border-t border-border/70 bg-white/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12 lg:mb-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-accent">Dokumentasi</p>
            <h2 id="arsip-judul" className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-dark">Arsip Kegiatan</h2>
          </div>
          <p className="text-neutral-500 max-w-md text-[15px] leading-relaxed">
            Jejak perjalanan KMKC dari tahun ke tahun — {total} foto dari {years.length} tahun kegiatan.
          </p>
        </div>

        <Paged size={3} param="arsip" noun="tahun" className="divide-y divide-border/70">
          {years.map(({ year, items }) => (
            <div key={year} className="py-10 lg:py-12 grid lg:grid-cols-[11rem_minmax(0,1fr)] gap-6 lg:gap-12 first:pt-0">
              <div className="lg:sticky lg:top-28 self-start">
                <p className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gradient leading-none tabular-nums">{year}</p>
                <p className="mt-2 text-sm text-neutral-400">{items.length} foto</p>
              </div>
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  {items.slice(0, PER_YEAR).map((g) => <Figure key={g.id} g={g} />)}
                </div>
                {items.length > PER_YEAR && (
                  <details className="group/more mt-6">
                    <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline [&::-webkit-details-marker]:hidden">
                      <span className="group-open/more:hidden">Tampilkan {items.length - PER_YEAR} foto lainnya</span>
                      <span className="hidden group-open/more:inline">Sembunyikan</span>
                    </summary>
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                      {items.slice(PER_YEAR).map((g) => <Figure key={g.id} g={g} />)}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </Paged>
      </div>
    </section>
  );
}
