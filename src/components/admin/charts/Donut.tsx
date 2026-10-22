export interface DonutItem { label: string; value: number; color: string }

/** Donat statis (SVG, tanpa JS). Nilai & persen selalu tampil di legenda, jadi warna bukan satu-satunya penanda. */
export default function Donut({ items, centerLabel }: { items: DonutItem[]; centerLabel: string }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const R = 15.915; // keliling = 100
  let offset = 25;
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[116px] w-[116px] shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full" role="img" aria-label={`${centerLabel}: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}`}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4.4" />
          {total > 0 &&
            items.map((it) => {
              const pct = (it.value / total) * 100;
              const gap = pct > 4 ? 0.8 : 0;
              const el = (
                <circle key={it.label} cx="21" cy="21" r={R} fill="none" stroke={it.color} strokeWidth="4.4" strokeDasharray={`${Math.max(pct - gap, 0)} ${100 - Math.max(pct - gap, 0)}`} strokeDashoffset={offset} />
              );
              offset -= pct;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-semibold leading-none tracking-tight tnum">{new Intl.NumberFormat("id-ID").format(total)}</span>
          <span className="mt-1 text-[11px] text-[var(--ad-mute)]">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5 text-[14px]">
        {items.length === 0 && <li className="text-[var(--ad-faint)]">Belum ada data.</li>}
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
            <span className="flex-1 truncate text-[var(--ad-ink-2)]">{it.label}</span>
            <span className="font-medium tnum">{total ? Math.round((it.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
