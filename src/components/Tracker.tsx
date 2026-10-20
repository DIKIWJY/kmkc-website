"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** Beacon kunjungan ringan (±0,5 KB, tanpa library). Tidak aktif di /admin dan menghormati Do Not Track. */
export default function Tracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || last.current === pathname) return;
    if (navigator.doNotTrack === "1") return;
    last.current = pathname;

    const today = new Date().toISOString().slice(0, 10);
    const fresh = safe(() => localStorage.getItem("kmkc_v") !== today, false);
    if (fresh) safe(() => localStorage.setItem("kmkc_v", today), undefined);

    // Sumber trafik ditentukan sekali per sesi (saat masuk), lalu dipakai ulang untuk halaman berikutnya.
    let src = safe(() => sessionStorage.getItem("kmkc_src"), null);
    if (src === null) {
      const ref = safe(() => (document.referrer ? new URL(document.referrer).hostname : ""), "");
      const utm = new URLSearchParams(location.search).get("utm_source") ?? "";
      src = JSON.stringify({ ref: ref === location.hostname ? "" : ref, utm });
      safe(() => sessionStorage.setItem("kmkc_src", src!), undefined);
    }
    const { ref, utm } = JSON.parse(src) as { ref: string; utm: string };

    const payload = JSON.stringify({ path: pathname, ref, utm, fresh });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" })))) {
      fetch("/api/track", { method: "POST", body: payload, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
