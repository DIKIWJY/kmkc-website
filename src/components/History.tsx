import { GraduationCap, Users, CalendarDays } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { renderBold } from "@/lib/rich";
import type { Founder, TimelineItem } from "@/lib/types";

interface HistoryProps {
  name: string;
  history: string;
  timeline: TimelineItem[];
  founders: Founder[];
}

/** Tahun pertama yang ditemukan di data (mis. "27 Januari 2008" → "2008"). */
function firstYear(timeline: TimelineItem[], history: string): string | null {
  const re = /\b(19|20)\d{2}\b/;
  for (const t of timeline) {
    const m = re.exec(t.date);
    if (m) return m[0];
  }
  return re.exec(history)?.[0] ?? null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function History({ name, history, timeline, founders }: HistoryProps) {
  if (!history.trim() && timeline.length === 0 && founders.length === 0) return null;

  const paragraphs = history.split("\n\n").filter(Boolean);
  const year = firstYear(timeline, history);

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-surface/70">
      {year && (
        <span
          aria-hidden
          className="pointer-events-none select-none hidden sm:block absolute -right-6 top-10 text-[16rem] lg:text-[22rem] leading-none font-black tracking-tighter text-primary/[0.045]"
        >
          {year}
        </span>
      )}

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading
          title={`History of ${name}`}
          subtitle="Dari obrolan ringan para mahasiswa di perantauan hingga menjadi rumah bersama mahasiswa Cempaka."
          className="mb-14 lg:mb-20"
        />

        {/* ---------- pembuka ---------- */}
        {paragraphs.length > 0 && (
          <div data-a="up" className="grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-center soft-card !rounded-[28px] p-8 sm:p-12 hover:!translate-y-0">
            {year && (
              <div className="text-center lg:text-left">
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-accent">Sejak</p>
                <p className="text-7xl sm:text-8xl font-black tracking-tighter leading-none text-gradient">{year}</p>
              </div>
            )}
            <div className="space-y-4 text-[17px] leading-[1.85] text-neutral-500 lg:border-l lg:border-border lg:pl-14">
              {paragraphs.map((p, i) => (
                <p key={i}>{renderBold(p)}</p>
              ))}
            </div>
          </div>
        )}

        {/* ---------- linimasa ---------- */}
        {timeline.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <h3 data-a="up" className="flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-primary mb-12">
              <CalendarDays size={18} className="text-accent" /> Perjalanan
            </h3>

            <ol data-scrub="0.7" className="relative">
              <span
                aria-hidden
                className="timeline-line absolute left-5 md:left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary via-accent-light to-sky/20"
              />
              {timeline.map((t, i) => {
                const left = i % 2 === 0;
                const last = i === timeline.length - 1;
                return (
                  <li key={i} className="relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-x-20 pb-12 last:pb-0">
                    <span
                      aria-hidden
                      className={`absolute left-5 md:left-1/2 top-6 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center ring-[6px] ring-surface ${
                        last ? "bg-brand-gradient shadow-lg shadow-blue-500/30" : "bg-white shadow-md shadow-blue-900/10 border-2 border-primary"
                      }`}
                    >
                      <span className={`text-xs font-extrabold ${last ? "text-white" : "text-primary"}`}>{i + 1}</span>
                    </span>

                    {/* tanggal besar di sisi seberang kartu (desktop) */}
                    <p
                      aria-hidden
                      data-a="up" className={`hidden md:block pt-6 text-3xl lg:text-4xl font-black tracking-tight text-primary/25 ${
                        left ? "md:col-start-2 md:row-start-1 md:pl-4" : "md:col-start-1 md:row-start-1 md:text-right md:pr-4"
                      }`}
                    >
                      {t.date}
                    </p>

                    <article
                      data-a="up" className={`md:row-start-1 soft-card p-6 sm:p-7 ${left ? "md:col-start-1 md:text-right" : "md:col-start-2"} ${last ? "ring-2 ring-accent/40" : ""}`}
                    >
                      <span className="inline-flex md:hidden items-center rounded-full bg-primary/10 text-primary text-xs font-bold px-3.5 py-1.5">
                        {t.date}
                      </span>
                      <h4 className="mt-3 text-xl font-extrabold text-neutral-900 leading-snug">{t.title}</h4>
                      {t.desc && <p className="mt-2 text-neutral-500 leading-relaxed">{renderBold(t.desc)}</p>}
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* ---------- penggagas ---------- */}
        {founders.length > 0 && (
          <div className="mt-24 lg:mt-32">
            <div data-a="up" className="text-center max-w-2xl mx-auto mb-12">
              <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-accent">
                <Users size={15} /> Para penggagas
              </p>
              <h3 className="mt-3 text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                {founders.length} mahasiswa di balik lahirnya {name}
              </h3>
            </div>

            <ul data-stagger="110" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {founders.map((f, i) => (
                <li
                  key={i}
                  data-a="up" data-tilt className={`soft-card p-5 sm:p-7 text-center flex flex-col items-center ${f.role ? "ring-2 ring-accent/40" : ""}`}
                >
                  <span className="w-20 h-20 rounded-full p-[3px] bg-brand-gradient shadow-lg shadow-blue-500/20">
                    <span className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-black">
                      <span className="text-gradient">{initials(f.name)}</span>
                    </span>
                  </span>
                  <h4 className="mt-4 font-bold text-neutral-900 leading-tight">{f.name}</h4>
                  {f.campus && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 rounded-full px-3 py-1.5">
                      <GraduationCap size={13} /> {f.campus}
                    </span>
                  )}
                  {f.role && (
                    <span className="mt-3 text-[11px] font-bold tracking-wide uppercase text-white bg-brand-gradient rounded-full px-3 py-1">
                      {f.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
