"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Daftar nomor halaman dengan elipsis: 1 … 4 5 6 … 12 */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1]);
  if (page <= 3) [3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 3, pages - 2].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

/**
 * Status halaman untuk daftar yang dipotong di klien. `anchor` = elemen penanda awal daftar (halaman digulir ke sana saat berpindah). Nomor halaman disimpan di alamat (?hal=2) lewat history.replaceState,
 * jadi tautan ke halaman tertentu bisa dibagikan; HTML awal selalu halaman 1 (tetap statis dan cepat).
 */
export function usePaged(total: number, size: number, anchor: RefObject<HTMLElement | null>, param = "hal") {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page, pages);

  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get(param) ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (n > 1) setPage(n);
  }, [param]);

  const writeUrl = useCallback((n: number) => {
    try {
      const u = new URL(window.location.href);
      if (n > 1) u.searchParams.set(param, String(n));
      else u.searchParams.delete(param);
      window.history.replaceState(window.history.state, "", u);
    } catch { /* abaikan: alamat hanya kemudahan */ }
  }, [param]);

  const go = useCallback((n: number) => {
    const next = Math.min(Math.max(1, n), pages);
    setPage(next);
    writeUrl(next);
    const el = anchor.current;
    if (el) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
  }, [pages, writeUrl, anchor]);

  /** Kembali ke halaman 1 tanpa menggulir (dipakai saat filter / pencarian berubah). */
  const reset = useCallback(() => {
    setPage(1);
    writeUrl(1);
  }, [writeUrl]);

  return { page: cur, pages, start: (cur - 1) * size, end: cur * size, go, reset };
}

interface Props {
  page: number;
  pages: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
  variant?: "site" | "admin";
  /** Kata benda untuk keterangan, mis. "berita" → "Menampilkan 9–16 dari 34 berita". */
  noun?: string;
  /** Tanpa keterangan jumlah (untuk kolom sempit). */
  compact?: boolean;
}

export default function Pagination({ page, pages, total, size, onChange, variant = "site", noun = "data", compact = false }: Props) {
  if (pages <= 1) return null;
  const admin = variant === "admin";
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);

  const base = admin
    ? "inline-flex h-8 min-w-8 items-center justify-center rounded-[9px] px-2 text-[13px] font-medium tnum transition-colors"
    : "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-semibold tabular-nums transition-colors";
  const on = admin ? "bg-[var(--ad-blue)] text-white" : "bg-primary-dark text-white shadow-md shadow-blue-900/20";
  const off = admin ? "text-[var(--ad-ink-2)] hover:bg-black/5" : "text-neutral-600 hover:bg-primary/10 hover:text-primary-dark";
  const arrow = `${base} ${off} disabled:pointer-events-none disabled:opacity-30`;

  return (
    <nav
      aria-label="Halaman"
      className={admin
        ? `flex flex-col items-center gap-2 border-t border-[var(--ad-line)] px-4 py-3 text-[13px] text-[var(--ad-mute)] ${compact ? "" : "sm:flex-row sm:justify-between"}`
        : "mt-12 flex flex-col items-center gap-4 sm:mt-14"}
    >
      {!compact && (
        <p className={admin ? "tnum" : "text-sm text-neutral-400"}>
          Menampilkan {from}–{to} dari {total} {noun}
        </p>
      )}
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <button type="button" className={arrow} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Halaman sebelumnya">
            <ChevronLeft size={admin ? 16 : 20} />
          </button>
        </li>
        {/* Ponsel: ringkas "Halaman 2 dari 5" agar tidak melebar; ≥sm: deretan nomor */}
        <li className={`sm:hidden px-3 ${admin ? "text-[13px] text-[var(--ad-ink-2)]" : "text-[15px] font-semibold text-primary-dark"} tabular-nums`} aria-hidden>
          {page} / {pages}
        </li>
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`g${i}`} aria-hidden className={`hidden sm:block px-1 ${admin ? "text-[var(--ad-faint)]" : "text-neutral-300"}`}>…</li>
          ) : (
            <li key={n} className="hidden sm:block">
              <button
                type="button" onClick={() => onChange(n)}
                aria-label={`Halaman ${n}`} aria-current={n === page ? "page" : undefined}
                className={`${base} ${n === page ? on : off}`}
              >
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className={arrow} disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Halaman berikutnya">
            <ChevronRight size={admin ? 16 : 20} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
