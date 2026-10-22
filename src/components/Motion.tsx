"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Mesin animasi halaman publik (tanpa library, ±5 KB). Bekerja lewat atribut data-* yang dipasang
 * di komponen server, sehingga HTML tetap lengkap untuk SEO dan tetap terbaca bila JS/animasi mati.
 *
 *  data-a="up|left|right|zoom|blur|clip|fade|bar|split"  muncul saat masuk layar (data-d = jeda ms)
 *  data-stagger="70"   anak ber-data-a muncul berurutan
 *  data-px="0.12"      parallax vertikal saat scroll
 *  data-scrub="0.6"    variabel --p (0→1) mengikuti posisi elemen di layar (garis timeline)
 *  data-scrub-words    kata-kata terisi warna mengikuti scroll
 *  data-tilt           kartu miring 3D mengikuti kursor
 *  data-magnetic       tombol tertarik ke kursor
 *  data-cursor="Teks"  cincin kursor membesar + label
 *  data-hero           variabel --hp (scroll) dan --mx/--my (kursor) untuk hero
 *  data-skew           miring tipis mengikuti kecepatan scroll (pita teks)
 * Aktif hanya bila <html class="m"> (diatur skrip di <head>; mati bila pengguna memilih "kurangi gerakan").
 */
export default function Motion() {
  const path = usePathname();
  const glow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("m")) return;
    (window as unknown as { __m?: number }).__m = 1;

    const timers: number[] = [];
    const cleanups: Array<() => void> = [];
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const vh = () => window.innerHeight;

    /* ---------- Muncul saat masuk layar ---------- */
    const prepare = (el: HTMLElement) => {
      const group = el.closest<HTMLElement>("[data-stagger]");
      if (group && !el.dataset.d) {
        const step = Number(group.dataset.stagger) || 70;
        const sibs = Array.from(group.querySelectorAll<HTMLElement>("[data-a]"));
        el.style.setProperty("--d", `${Math.min(sibs.indexOf(el) * step, 560)}ms`);
      } else if (el.dataset.d) {
        el.style.setProperty("--d", `${el.dataset.d}ms`);
      }
    };
    const reveal = (el: HTMLElement) => {
      el.classList.add("in");
      const d = parseFloat(el.style.getPropertyValue("--d")) || 0;
      // setelah selesai, lepas atribut agar transisi hover bawaan komponen (kartu, tombol) kembali normal
      timers.push(
        window.setTimeout(() => {
          el.removeAttribute("data-a");
          el.classList.remove("in");
          el.style.removeProperty("--d");
        }, 1500 + d + (el.querySelectorAll(".sw").length ? el.querySelectorAll(".sw").length * 60 : 0)),
      );
    };
    // elemen "clip" terpotong seluruhnya sehingga IntersectionObserver menganggapnya tak terlihat → amati induknya
    const watched = new Map<Element, HTMLElement[]>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            io.unobserve(e.target);
            (watched.get(e.target) ?? []).forEach(reveal);
            watched.delete(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const seen = new WeakSet<HTMLElement>();
    const watch = (all: HTMLElement[]) => {
      const list = all.filter((el) => !seen.has(el));
      list.forEach((el) => seen.add(el));
      list.forEach(prepare);
      list.forEach((el) => {
        const t = el.dataset.a === "clip" && el.parentElement ? el.parentElement : el;
        watched.set(t, [...(watched.get(t) ?? []), el]);
        io.observe(t);
      });
    };
    const introWait = root.classList.contains("m-intro") && performance.now() < 1400 ? 1050 : 0;
    timers.push(window.setTimeout(() => watch(Array.from(document.querySelectorAll<HTMLElement>("[data-a]"))), introWait));
    cleanups.push(() => io.disconnect());

    // Elemen yang baru muncul sesudahnya (pindah halaman daftar, ganti filter, "muat lebih banyak") juga ikut dianimasikan,
    // bukan tertinggal tersembunyi.
    const mo = new MutationObserver((records) => {
      const fresh: HTMLElement[] = [];
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-a]")) fresh.push(n);
          n.querySelectorAll<HTMLElement>("[data-a]").forEach((c) => fresh.push(c));
        });
      }
      if (fresh.length) watch(Array.from(new Set(fresh)));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => mo.disconnect());

    /* ---------- Elemen yang dipantau saat scroll ---------- */
    const px = Array.from(document.querySelectorAll<HTMLElement>("[data-px]"));
    const scrub = Array.from(document.querySelectorAll<HTMLElement>("[data-scrub]"));
    const words = Array.from(document.querySelectorAll<HTMLElement>("[data-scrub-words]")).map((el) => ({
      el,
      list: Array.from(el.querySelectorAll<HTMLElement>(".fw")),
    }));
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const skews = Array.from(document.querySelectorAll<HTMLElement>("[data-skew]"));
    const bar = document.querySelector<HTMLElement>(".scroll-progress");
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Navigasi utama"]');

    let lastY = window.scrollY;
    let lastT = performance.now();
    let vel = 0;
    let ticking = false;

    const frame = () => {
      ticking = false;
      const y = window.scrollY;
      const h = vh();
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      vel += ((y - lastY) / dt - vel) * 0.2; // px/ms, dihaluskan
      const dy = y - lastY;
      lastY = y;
      lastT = now;

      if (bar) {
        const max = document.documentElement.scrollHeight - h;
        bar.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
      }
      if (nav) {
        const menuOpen = !!document.getElementById("menu-situs");
        if (y < 90 || menuOpen || dy < -4) nav.classList.remove("nav-hidden");
        else if (dy > 4 && y > 220) nav.classList.add("nav-hidden");
      }
      if (hero) {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--hp", String(clamp(-r.top / (r.height * 0.75))));
      }
      for (const el of px) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) continue;
        const k = parseFloat(el.dataset.px || "0.1");
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - h / 2) * -k).toFixed(1)}px, 0)`;
      }
      for (const el of scrub) {
        const r = el.getBoundingClientRect();
        const a = parseFloat(el.dataset.scrub || "0.65");
        el.style.setProperty("--p", clamp((h * a - r.top) / Math.max(1, r.height)).toFixed(3));
      }
      for (const { el, list } of words) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > h + 100) continue;
        const p = clamp((h * 0.88 - r.top) / (r.height + h * 0.42));
        for (const w of list) w.classList.toggle("on", parseFloat(w.style.getPropertyValue("--k")) <= p * 1.05);
      }
      const sk = clamp(vel * 9, -9, 9).toFixed(2);
      for (const el of skews) el.style.setProperty("--sk", `${sk}deg`);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    frame();
    // velocity meluruh bila scroll berhenti
    const decay = window.setInterval(() => {
      if (Math.abs(vel) > 0.002) {
        vel *= 0.6;
        onScroll();
      }
    }, 90);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearInterval(decay);
    });

    /* ---------- Interaksi kursor (hanya perangkat dengan mouse) ---------- */
    if (fine) {
      const g = glow.current;
      const rg = ring.current;
      const lab = label.current;
      let tx = -200, ty = -200, gx = tx, gy = ty, rx = tx, ry = ty;
      let raf = 0;
      const loop = () => {
        gx += (tx - gx) * 0.08;
        gy += (ty - gy) * 0.08;
        rx += (tx - rx) * 0.22;
        ry += (ty - ry) * 0.22;
        if (g) g.style.transform = `translate3d(${gx - 260}px, ${gy - 260}px, 0)`;
        if (rg) rg.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const heroMouse = (e: PointerEvent) => {
        if (!hero) return;
        hero.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
        hero.style.setProperty("--my", (e.clientY / vh() - 0.5).toFixed(3));
      };
      const onMove = (e: PointerEvent) => {
        tx = e.clientX;
        ty = e.clientY;
        root.classList.add("cur-on");
        heroMouse(e);
        const t = e.target as HTMLElement | null;
        const hot = t?.closest<HTMLElement>("a, button, summary, label[for], [data-cursor]");
        const text = hot?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
        rg?.classList.toggle("hot", !!hot);
        rg?.classList.toggle("txt", !!text);
        if (lab && lab.textContent !== text) lab.textContent = text;

        // kartu miring
        const card = t?.closest<HTMLElement>("[data-tilt]");
        if (card) {
          const r = card.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width;
          const ny = (e.clientY - r.top) / r.height;
          card.style.setProperty("--mx", `${(nx * 100).toFixed(1)}%`);
          card.style.setProperty("--my", `${(ny * 100).toFixed(1)}%`);
          card.style.transform = `perspective(900px) rotateX(${((0.5 - ny) * 8).toFixed(2)}deg) rotateY(${((nx - 0.5) * 10).toFixed(2)}deg) translateY(-4px)`;
          card.classList.add("tilting");
        }
        // tombol magnet
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => {
          const r = m.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
          m.style.translate = near ? `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px` : "0 0";
        });
      };
      const onLeaveCard = (e: PointerEvent) => {
        const c = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-tilt].tilting");
        if (c && !c.contains(e.relatedTarget as Node | null)) {
          c.style.transform = "";
          c.classList.remove("tilting");
        }
      };
      const onOut = (e: MouseEvent) => {
        if (!e.relatedTarget) {
          root.classList.remove("cur-on");
          if (hero) {
            hero.style.setProperty("--mx", "0");
            hero.style.setProperty("--my", "0");
          }
        }
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerout", onLeaveCard as EventListener);
      document.addEventListener("mouseout", onOut);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerout", onLeaveCard as EventListener);
        document.removeEventListener("mouseout", onOut);
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      timers.forEach((t) => clearTimeout(t));
    };
  }, [path]);

  return (
    <>
      <div ref={glow} className="m-glow" aria-hidden />
      <div ref={ring} className="m-ring" aria-hidden>
        <span ref={label} />
      </div>
    </>
  );
}
