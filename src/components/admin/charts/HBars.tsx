import type { ReactNode } from "react";

export interface HBarItem { label: ReactNode; value: number; hint?: string }

/** Daftar batang horizontal: label di kiri, batang tipis warna utama, angka di kanan. */
export default function HBars({ items, empty = "Belum ada data." }: { items: HBarItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{it.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{new Intl.NumberFormat("id-ID").format(it.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
