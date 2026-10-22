"use client";

import Photo from "@/components/ui/Photo";
import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination, { usePaged } from "@/components/ui/Pagination";
import { currentPeriod, type OrgPeriod } from "@/lib/org";

const PER_PAGE = 12; // kartu per halaman dalam satu bidang

/** Menulis ?periode=&bidang= ke alamat (tanpa memuat ulang) agar tautan ke bidang tertentu bisa dibagikan. */
function writeParams(periode: string | null, bidang: string | null) {
  try {
    const u = new URL(window.location.href);
    for (const [k, v] of [["periode", periode], ["bidang", bidang]] as const) {
      if (v) u.searchParams.set(k, v);
      else u.searchParams.delete(k);
    }
    u.searchParams.delete("hal");
    window.history.replaceState(window.history.state, "", u);
  } catch { /* alamat hanya kemudahan */ }
}

export default function Kepengurusan({ org }: { org: OrgPeriod[] }) {
  const current = currentPeriod(org);
  const [periodLabel, setPeriodLabel] = useState(current?.label ?? "");
  const period = org.find((p) => p.label === periodLabel) ?? current;
  const divisions = (period?.divisions ?? []).filter((d) => d.members.length > 0);
  const [bidang, setBidang] = useState("");
  const active = divisions.find((d) => d.name === bidang) ?? divisions[0];

  // Tautan langsung (?periode=…&bidang=…) dibaca sekali setelah halaman tampil; HTML awal selalu periode aktif (tetap statis/cepat).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("periode"), b = q.get("bidang");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (p && org.some((x) => x.label === p)) setPeriodLabel(p);
    if (b) setBidang(b);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [org]);

  const gridTop = useRef<HTMLDivElement>(null);
  const members = active?.members ?? [];
  const pg = usePaged(members.length, PER_PAGE, gridTop);
  const shown = members.slice(pg.start, pg.end);

  if (!period) return null;
  const isCurrent = period.isCurrent;

  const pickPeriod = (label: string) => { setPeriodLabel(label); setBidang(""); pg.reset(); writeParams(label === current?.label ? null : label, null); };
  const pickBidang = (name: string) => { setBidang(name); pg.reset(); writeParams(period.label === current?.label ? null : period.label, name === divisions[0]?.name ? null : name); };

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading
          title="Kepengurusan"
          subtitle={`Periode ${period.label}${isCurrent ? " · kepengurusan saat ini" : " · arsip kepengurusan"}`}
          className="mb-10"
          page
        />

        {org.length > 1 && (
          <div data-a="up" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2" role="group" aria-label="Pilih periode">
            <span className="mr-1 text-sm font-semibold text-neutral-500">Periode</span>
            {org.map((p) => (
              <button
                key={p.label}
                onClick={() => pickPeriod(p.label)}
                aria-pressed={p.label === period.label}
                className={`px-4 py-2 rounded-full text-sm font-semibold tabular-nums transition-all ${
                  p.label === period.label
                    ? "bg-primary-dark text-white shadow-md shadow-blue-900/20"
                    : "bg-white text-neutral-600 ring-1 ring-border hover:ring-accent/40 hover:text-accent"
                }`}
              >
                {p.label}{p.isCurrent && <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">kini</span>}
              </button>
            ))}
          </div>
        )}

        {divisions.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">Susunan pengurus periode ini belum ditambahkan.</p>
        ) : (
          <>
            <div data-a="up" className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Pilih bidang">
              {divisions.map((d) => (
                <button
                  key={d.name}
                  onClick={() => pickBidang(d.name)}
                  aria-pressed={d.name === active?.name}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    d.name === active?.name
                      ? "bg-brand-gradient text-white shadow-md shadow-blue-500/25"
                      : "bg-white text-neutral-600 ring-1 ring-border hover:ring-accent/40 hover:text-accent"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            <div ref={gridTop} className="scroll-mt-28" />
            {active && (active.description || members.length > PER_PAGE) && (
              <p className="mb-6 text-neutral-500">{active.description}</p>
            )}
            <div key={`${period.label}|${active?.name}`} data-stagger="55" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {shown.map((m) => (
                <div key={m.id} data-a="up" data-tilt className="soft-card p-6 text-center">
                  <div className="relative w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-md">
                    {m.photo_url ? <Photo src={m.photo_url} alt={m.name} sizes="96px" /> : <User size={36} className="text-primary/60" />}
                  </div>
                  <h3 className="font-bold text-neutral-900 leading-snug">{m.name}</h3>
                  <p className="text-sm font-semibold text-accent mt-1 text-balance">{m.position}</p>
                </div>
              ))}
            </div>
            <Pagination page={pg.page} pages={pg.pages} total={members.length} size={PER_PAGE} onChange={pg.go} noun="pengurus" />
          </>
        )}
      </div>
    </section>
  );
}
