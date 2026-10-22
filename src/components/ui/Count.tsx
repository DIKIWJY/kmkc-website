"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Angka yang menghitung naik saat masuk layar. Tanpa JS/animasi → langsung tampil nilai akhirnya.
 * Mendukung awalan/akhiran ("500+", "Rp 2 jt"); bilangan tahun dihitung dari beberapa tahun sebelumnya.
 */
export default function Count({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    const m = /^(\D*)(\d+)(.*)$/.exec(value.trim());
    if (!el || !m || !root.classList.contains("m")) return;
    const target = parseInt(m[2], 10);
    if (!target) return;
    const from = target >= 1900 && target <= 2100 ? target - 45 : 0;
    const fmt = (n: number) => `${m[1]}${Math.round(n)}${m[3]}`;
    let raf = 0;
    let timer = 0;
    const kick = window.setTimeout(() => setShown(fmt(from)), 0);

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const wait = root.classList.contains("m-intro") ? Math.max(0, 1300 - performance.now()) : 150;
        timer = window.setTimeout(() => {
          const t0 = performance.now();
          const dur = 1700;
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
            setShown(fmt(from + (target - from) * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }, wait);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(kick);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
    </span>
  );
}
