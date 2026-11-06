export interface DonutItem { label: string; value: number; color: string }

/** Donat statis (SVG, tanpa JS). Nilai & persen selalu tampil di legenda, jadi warna bukan satu-satunya penanda. `color` boleh berupa var(--chart-n). */
export default function Donut({ items, centerLabel }: { items: DonutItem[]; centerLabel: string }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const R = 15.915; // keliling = 100
  let offset = 25;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-[116px] shrink-0">
        <svg viewBox="0 0 42 42" className="size-full" role="img" aria-label={`${centerLabel}: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}`}>
          <circle cx="21" cy="21" r={R} fill="none" className="stroke-muted" strokeWidth="4.4" />
          {total > 0 &&
            items.map((it) => {
              const pct = (it.value / total) * 100;
              const gap = pct > 4 ? 0.8 : 0;
              const el = (
                <circle
                  key={it.label} cx="21" cy="21" r={R} fill="none" style={{ stroke: it.color }} strokeWidth="4.4"
                  strokeDasharray={`${Math.max(pct - gap, 0)} ${100 - Math.max(pct - gap, 0)}`} strokeDashoffset={offset}
                />
              );
              offset -= pct;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold leading-none tracking-tight tabular-nums">{new Intl.NumberFormat("id-ID").format(total)}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
        {items.length === 0 && <li className="text-muted-foreground">Belum ada data.</li>}
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
            <span className="flex-1 truncate text-muted-foreground">{it.label}</span>
            <span className="font-medium tabular-nums">{total ? Math.round((it.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
