import type { ReactNode } from "react";

export interface HBarItem { label: ReactNode; value: number; hint?: string }

/** Daftar batang horizontal: label di kiri, batang tipis bergradasi, angka di kanan. */
export default function HBars({ items, empty = "Belum ada data." }: { items: HBarItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-neutral-400 py-8 text-center">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-neutral-700 min-w-0">{it.label}</span>
            <span className="font-semibold text-neutral-900 tabular-nums shrink-0">{new Intl.NumberFormat("id-ID").format(it.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-surface-alt overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
