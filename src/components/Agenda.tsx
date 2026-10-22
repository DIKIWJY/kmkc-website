import { CalendarPlus, Clock, MapPin, ArrowUpRight } from "lucide-react";
import Photo from "@/components/ui/Photo";
import SectionHeading from "@/components/ui/SectionHeading";
import Paged from "@/components/ui/Paged";
import Countdown from "@/components/Countdown";
import { daysUntil, formatDateID, googleCalendarUrl } from "@/lib/date";
import type { EventItem } from "@/lib/types";

function badge(days: number) {
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

/** Agenda mendatang selain yang terdekat: kartu kompak bertanggal. */
function UpcomingRow({ e }: { e: EventItem }) {
  const dt = new Date(`${e.event_date}T00:00:00Z`);
  return (
    <article data-a="left" data-tilt className="soft-card flex gap-5 p-5 sm:p-6 items-center">
      <div className="shrink-0 w-[4.5rem] rounded-2xl bg-brand-gradient text-white text-center py-3 shadow-md shadow-blue-500/25">
        <p className="text-3xl font-black leading-none">{dt.getUTCDate()}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/80">{dt.toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{badge(daysUntil(e.event_date))}</p>
        <h4 className="font-bold text-neutral-900 leading-snug">{e.title}</h4>
        <p className="mt-1 text-sm text-neutral-500 flex flex-wrap gap-x-4 gap-y-0.5">
          {e.event_time && <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {e.event_time}</span>}
          {e.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {e.location}</span>}
        </p>
      </div>
      <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" aria-label={`Tambah ${e.title} ke kalender`} className="shrink-0 w-10 h-10 rounded-full bg-primary/8 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition">
        <CalendarPlus size={17} />
      </a>
    </article>
  );
}

/** Kegiatan yang sudah lewat: baris bergaris tipis (bukan kotak), tanggal di kiri. */
function PastRow({ e }: { e: EventItem }) {
  const dt = new Date(`${e.event_date}T00:00:00Z`);
  return (
    <article data-a="up" className="flex gap-5 border-b border-black/10 py-5">
      <div className="w-14 shrink-0 text-center">
        <p className="text-2xl font-extrabold leading-none text-primary-dark tabular-nums">{dt.getUTCDate()}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">{dt.toLocaleDateString("id-ID", { month: "short", year: "2-digit", timeZone: "UTC" })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-bold leading-snug text-primary-dark">{e.title}</h4>
        {e.description && <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-neutral-500">{e.description}</p>}
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-neutral-400">
          {e.event_time && <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {e.event_time}</span>}
          {e.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {e.location}</span>}
        </p>
      </div>
    </article>
  );
}

export default function Agenda({ events, past = [], page }: { events: EventItem[]; past?: EventItem[]; page?: boolean }) {
  if (events.length === 0 && past.length === 0) return null;
  const [next, ...rest] = events;
  const d = next ? daysUntil(next.event_date) : 0;

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading
          title="Agenda Kegiatan"
          subtitle="Catat tanggalnya, sampai jumpa di kegiatan KMKC berikutnya."
          className="mb-14"
          page={page}
          href="/agenda"
        />

        {!next && (
          <p className="rounded-3xl bg-surface px-8 py-10 text-center text-neutral-500">Belum ada agenda mendatang. Pantau terus halaman ini, atau lihat kegiatan sebelumnya di bawah.</p>
        )}

        {next && (
          <div className={`grid gap-6 ${rest.length ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}>
            {/* ---------- acara terdekat ---------- */}
            <article data-a="zoom" className="relative overflow-hidden rounded-[28px] gradient-section text-white p-8 sm:p-11 flex flex-col self-start">
              {next.cover_image && (
                <Photo src={next.cover_image} alt="" sizes="(max-width: 1024px) 100vw, 600px" className="opacity-25 mix-blend-luminosity" />
              )}
              <span aria-hidden className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex flex-col h-full">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white text-primary text-xs font-extrabold tracking-wide uppercase px-3.5 py-1.5">Acara terdekat</span>
                  <span className="rounded-full bg-white/15 text-xs font-bold px-3.5 py-1.5">{badge(d)}</span>
                </div>

                <h3 className="mt-6 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">{next.title}</h3>
                {next.description && <p className="mt-3 max-w-xl text-white/75 leading-relaxed">{next.description}</p>}

                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
                  <li className="inline-flex items-center gap-2"><CalendarPlus size={16} className="text-sky-200" /> {formatDateID(next.event_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</li>
                  {next.event_time && <li className="inline-flex items-center gap-2"><Clock size={16} className="text-sky-200" /> {next.event_time}</li>}
                  {next.location && <li className="inline-flex items-center gap-2"><MapPin size={16} className="text-sky-200" /> {next.location}</li>}
                </ul>

                <div className="mt-8"><Countdown date={next.event_date} /></div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {next.link && (
                    <a href={next.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-primary font-bold text-sm px-6 py-3 hover:bg-sky-50 transition">
                      Daftar / info <ArrowUpRight size={16} />
                    </a>
                  )}
                  <a href={googleCalendarUrl(next)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full ring-1 ring-white/40 text-white font-semibold text-sm px-6 py-3 hover:bg-white/10 transition">
                    <CalendarPlus size={16} /> Tambah ke kalender
                  </a>
                </div>
              </div>
            </article>

            {/* ---------- berikutnya (halaman penuh: 4 per halaman) ---------- */}
            {rest.length > 0 &&
              (page ? (
                <Paged size={4} stagger={120} noun="agenda" param="hal" className="flex flex-col gap-4">
                  {rest.map((e) => <UpcomingRow key={e.id} e={e} />)}
                </Paged>
              ) : (
                <div data-stagger="120" className="flex flex-col gap-4">
                  {rest.map((e) => <UpcomingRow key={e.id} e={e} />)}
                </div>
              ))}
          </div>
        )}

        {/* ---------- telah berlalu (hanya di halaman penuh) ---------- */}
        {page && past.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] uppercase text-accent">Arsip</p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-primary-dark">Telah berlalu</h2>
              </div>
              <p className="max-w-sm text-[15px] text-neutral-500">Kegiatan KMKC yang sudah terlaksana, dari yang terbaru.</p>
            </div>
            <div className="border-t border-black/10">
              <Paged size={6} noun="kegiatan" param="lalu" className="grid lg:grid-cols-2 lg:gap-x-16">
                {past.map((e) => <PastRow key={e.id} e={e} />)}
              </Paged>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
