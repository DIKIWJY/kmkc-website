export interface DonutItem { label: string; value: number; color: string }

/** Donat statis (SVG, tanpa JS). Nilai & persen selalu tampil di legenda, jadi warna bukan satu-satunya penanda. */
export default function Donut({ items, centerLabel }: { items: DonutItem[]; centerLabel: string }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const R = 15.915; // keliling = 100
  let offset = 25;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-0" role="img" aria-label={`${centerLabel}: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}`}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="#eaf1fb" strokeWidth="5" />
          {total > 0 &&
            items.map((it) => {
              const pct = (it.value / total) * 100;
              const gap = pct > 4 ? 0.8 : 0;
              const el = (
                <circle key={it.label} cx="21" cy="21" r={R} fill="none" stroke={it.color} strokeWidth="5" strokeDasharray={`${Math.max(pct - gap, 0)} ${100 - Math.max(pct - gap, 0)}`} strokeDashoffset={offset} />
              );
              offset -= pct;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-primary-dark tabular-nums">{new Intl.NumberFormat("id-ID").format(total)}</span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2.5 text-sm min-w-0">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: it.color }} />
            <span className="text-neutral-600 truncate flex-1">{it.label}</span>
            <span className="font-semibold text-neutral-800 tabular-nums">{total ? Math.round((it.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
