/** Utilitas tanggal — seluruh perhitungan memakai zona WIB (UTC+7), zona KMKC. */

const WIB_OFFSET_MS = 7 * 3600 * 1000;

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
export function todayWIB(now = Date.now()): string {
  return new Date(now + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Selisih hari kalender dari hari ini (WIB) ke `date`. 0 = hari ini, 1 = besok, negatif = lewat. */
export function daysUntil(date: string, now = Date.now()): number {
  const a = Date.parse(`${date}T00:00:00Z`);
  const b = Date.parse(`${todayWIB(now)}T00:00:00Z`);
  return Math.round((a - b) / 86400000);
}

/** Tambah n hari ke tanggal YYYY-MM-DD. */
export function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

export const formatDateID = (date: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  date ? new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("id-ID", { ...opts, timeZone: "UTC" }) : "";

/** Tautan "Tambah ke Google Calendar" untuk acara sehari penuh. */
export function googleCalendarUrl(e: { title: string; description?: string; location?: string; event_date: string }): string {
  const d = e.event_date.replaceAll("-", "");
  const end = addDays(e.event_date, 1).replaceAll("-", "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${d}/${end}`,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
