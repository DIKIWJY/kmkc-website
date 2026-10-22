/** Waktu relatif bahasa Indonesia: "Baru saja", "1 menit lalu", "2 jam lalu", "3 hari lalu"; lebih dari seminggu → tanggal. */
export function relTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const sec = Math.max(0, Math.floor((now - t) / 1000));
  if (sec < 60) return "Baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return absTime(iso, false);
}

export function absTime(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return withTime
    ? d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
