"use client";

import { useEffect, useState } from "react";

/** Hitung mundur ke 00:00 WIB pada tanggal acara. Render awal kosong agar SSR/hidrasi konsisten. */
export default function Countdown({ date }: { date: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse(`${date}T00:00:00+07:00`);
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);

  if (left !== null && left <= 0) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
        <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" /> Berlangsung hari ini
      </p>
    );
  }

  const s = left === null ? 0 : Math.floor(left / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: "Hari" },
    { v: Math.floor((s % 86400) / 3600), l: "Jam" },
    { v: Math.floor((s % 3600) / 60), l: "Menit" },
    { v: s % 60, l: "Detik" },
  ];

  return (
    <div className="flex gap-2.5 sm:gap-3" role="timer" aria-label="Hitung mundur menuju acara">
      {parts.map(({ v, l }) => (
        <div key={l} className="min-w-[4.2rem] sm:min-w-[5rem] rounded-2xl bg-white/12 backdrop-blur px-3 py-3 text-center ring-1 ring-white/15">
          <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-white" suppressHydrationWarning>
            {left === null ? "--" : String(v).padStart(2, "0")}
          </p>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">{l}</p>
        </div>
      ))}
    </div>
  );
}
