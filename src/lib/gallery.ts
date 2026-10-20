import type { GalleryItem } from "./types";
import { addDays, todayWIB } from "./date";

const dateOf = (g: GalleryItem) => (g.event_date ?? g.created_at ?? "").slice(0, 10);

/**
 * Memisahkan galeri jadi "terbaru" (≤ 12 bulan terakhir → coverflow + grid) dan "arsip" (lebih lama → bagian statis per tahun).
 * Admin tidak perlu mengatur apa pun: cukup isi tanggal kegiatan saat mengunggah foto.
 * Bila kegiatan terbaru kurang dari 3, enam foto teratas tetap dipakai agar coverflow tidak kosong.
 */
export function splitGallery(items: GalleryItem[], today = todayWIB()) {
  const sorted = [...items].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  const cutoff = addDays(today, -365);
  let recent = sorted.filter((g) => !dateOf(g) || dateOf(g) >= cutoff);
  if (recent.length < 3) recent = sorted.slice(0, 6);
  const keep = new Set(recent);
  const archive = sorted.filter((g) => !keep.has(g) && g.image_url);

  const byYear = new Map<string, GalleryItem[]>();
  for (const g of archive) {
    const y = dateOf(g).slice(0, 4) || "Lainnya";
    byYear.set(y, [...(byYear.get(y) ?? []), g]);
  }
  const years = [...byYear.entries()].map(([year, list]) => ({ year, items: list }));
  return { recent, archive, years };
}
