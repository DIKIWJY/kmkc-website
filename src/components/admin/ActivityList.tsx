"use client";

import { useState } from "react";
import Pagination from "@/components/ui/Pagination";
import RelTime from "@/components/ui/RelTime";
import type { AuditEntry } from "@/lib/types";

const PER_PAGE = 15; // aktivitas per halaman

export default function ActivityList({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage] = useState(1);
  const [oldest, setOldest] = useState(false);
  const sorted = oldest ? [...rows].reverse() : rows; // data dari server sudah terbaru → terlama
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const visible = sorted.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--ad-line)] px-4 py-3">
        <span className="text-[13px] text-[var(--ad-mute)] tnum">{rows.length} aktivitas</span>
        <div className="ad-seg" role="group" aria-label="Urutan">
          {([false, true] as const).map((o) => (
            <button key={String(o)} aria-pressed={oldest === o} onClick={() => { setOldest(o); setPage(1); }}>{o ? "Terlama" : "Terbaru"}</button>
          ))}
        </div>
      </div>
      {/* Ponsel: daftar */}
      <ul className="ad-divide md:hidden">
        {visible.map((a) => (
          <li key={a.id} className="px-4 py-3">
            <p className="text-[14.5px]">
              <b className="font-semibold">{a.user_email.split("@")[0]}</b> <span className="text-[var(--ad-mute)]">{a.action} {a.entity.toLowerCase()}</span> {a.label && <span>“{a.label}”</span>}
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--ad-faint)]"><RelTime iso={a.created_at} />
            </p>
          </li>
        ))}
      </ul>
      {/* Tablet & desktop: tabel */}
      <table className="ad-table hidden md:table">
        <thead><tr><th>Waktu</th><th>Admin</th><th>Aktivitas</th></tr></thead>
        <tbody>
          {visible.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap text-[var(--ad-mute)]"><RelTime iso={a.created_at} /></td>
              <td className="text-[var(--ad-ink-2)]">{a.user_email}</td>
              <td className="text-[var(--ad-mute)]">{a.action} <b className="font-semibold text-[var(--ad-ink)]">{a.entity.toLowerCase()}</b> {a.label && <span className="text-[var(--ad-ink)]">“{a.label}”</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination variant="admin" page={cur} pages={pages} total={rows.length} size={PER_PAGE} onChange={setPage} noun="aktivitas" />
    </>
  );
}
