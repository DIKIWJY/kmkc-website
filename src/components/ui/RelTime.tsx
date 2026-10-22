"use client";

import { useSyncExternalStore } from "react";
import { relTime, absTime } from "@/lib/reltime";

/* Satu pewaktu bersama untuk semua label waktu di halaman (diperbarui tiap 20 detik). */
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const subs = new Set<() => void>();

function subscribe(cb: () => void) {
  subs.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      subs.forEach((f) => f());
    }, 20_000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Menampilkan "2 menit lalu" yang terus berjalan; tanggal lengkap muncul saat kursor diarahkan.
 * Di server (dan render pertama) tampil tanggal biasa supaya tidak ada selisih hidrasi.
 */
export default function RelTime({ iso, className = "" }: { iso: string; className?: string }) {
  const n = useSyncExternalStore(subscribe, () => now, () => 0);
  return (
    <time dateTime={iso} title={absTime(iso)} className={className}>
      {n ? relTime(iso, n) : absTime(iso, false)}
    </time>
  );
}
