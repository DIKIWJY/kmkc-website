import type { ReactNode } from "react";

export interface HBarItem { label: ReactNode; value: number; hint?: string }

/** Daftar batang horizontal: label di kiri, batang tipis biru, angka di kanan. */
export default function HBars({ items, empty = "Belum ada data." }: { items: HBarItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-[14px] text-[var(--ad-faint)]">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate text-[var(--ad-ink-2)]">{it.label}</span>
            <span className="shrink-0 font-medium tnum">{new Intl.NumberFormat("id-ID").format(it.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
            <div className="h-full rounded-full bg-[#0071e3]" style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
