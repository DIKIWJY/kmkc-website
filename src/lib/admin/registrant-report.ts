/** Opsi & penyaringan Laporan Pendaftar (dipakai form di klien dan halaman laporan di server). */
export const REG_STATUSES = [
  { key: "baru", label: "Baru" },
  { key: "dihubungi", label: "Dihubungi" },
  { key: "diterima", label: "Diterima" },
  { key: "ditolak", label: "Ditolak" },
] as const;

export type RegGroup = "none" | "village" | "campus" | "batch" | "status";
export type RegSort = "new" | "old" | "name";
export type RegView = "rekap" | "detail";

export interface RegOptions {
  statuses: string[];
  from: string;
  to: string;
  village: string;
  campus: string;
  batch: string;
  view: RegView;
  group: RegGroup;
  sort: RegSort;
  stats: boolean; // ringkasan statistik
  reason: boolean; // alasan bergabung
  proofs: boolean; // gambar bukti follow (tampilan detail)
  contact: boolean; // WhatsApp & email
  notes: boolean; // catatan internal pengurus
  sign: boolean; // kolom pengesahan
  auto: boolean;
}

export interface RegLite {
  id: string;
  status: string;
  village: string;
  campus: string;
  batch: string;
  created_at: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ALL_STATUS = REG_STATUSES.map((s) => s.key) as string[];

export const norm = (v: string) => v.replace(/\s+/g, " ").trim().toLowerCase();
/** Hari kalender WIB (UTC+7) dari stempel waktu, format YYYY-MM-DD. */
export const wibDay = (iso: string) => new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 10);

export function defaultRegOptions(): RegOptions {
  return {
    statuses: [...ALL_STATUS], from: "", to: "", village: "", campus: "", batch: "",
    view: "rekap", group: "none", sort: "new",
    stats: true, reason: true, proofs: true, contact: true, notes: false, sign: false, auto: false,
  };
}

export function parseRegOptions(sp: Record<string, string | string[] | undefined>): RegOptions {
  const d = defaultRegOptions();
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const picked = one("st").split(",").filter((s) => ALL_STATUS.includes(s));
  const flag = (k: string, def: boolean) => (one(k) === "" ? def : one(k) === "1");
  const pick = <T extends string>(k: string, allowed: readonly T[], def: T): T => (allowed as readonly string[]).includes(one(k)) ? (one(k) as T) : def;
  return {
    statuses: picked.length ? picked : d.statuses,
    from: DATE.test(one("from")) ? one("from") : "",
    to: DATE.test(one("to")) ? one("to") : "",
    village: one("village").slice(0, 120),
    campus: one("campus").slice(0, 160),
    batch: one("batch").slice(0, 20),
    view: pick("view", ["rekap", "detail"] as const, d.view),
    group: pick("group", ["none", "village", "campus", "batch", "status"] as const, d.group),
    sort: pick("sort", ["new", "old", "name"] as const, d.sort),
    stats: flag("stats", d.stats), reason: flag("reason", d.reason), proofs: flag("proofs", d.proofs),
    contact: flag("contact", d.contact), notes: flag("notes", d.notes), sign: flag("sign", d.sign), auto: flag("auto", false),
  };
}

export function regQuery(o: RegOptions): string {
  const q = new URLSearchParams();
  q.set("st", o.statuses.join(","));
  if (o.from) q.set("from", o.from);
  if (o.to) q.set("to", o.to);
  if (o.village) q.set("village", o.village);
  if (o.campus) q.set("campus", o.campus);
  if (o.batch) q.set("batch", o.batch);
  q.set("view", o.view); q.set("group", o.group); q.set("sort", o.sort);
  for (const [k, v] of [["stats", o.stats], ["reason", o.reason], ["proofs", o.proofs], ["contact", o.contact], ["notes", o.notes], ["sign", o.sign], ["auto", o.auto]] as const) q.set(k, v ? "1" : "0");
  return q.toString();
}

export function matchReg(r: RegLite, o: RegOptions): boolean {
  if (!o.statuses.includes(r.status)) return false;
  const day = wibDay(r.created_at);
  if (o.from && day < o.from) return false;
  if (o.to && day > o.to) return false;
  if (o.village && norm(r.village) !== norm(o.village)) return false;
  if (o.campus && norm(r.campus) !== norm(o.campus)) return false;
  if (o.batch && norm(r.batch) !== norm(o.batch)) return false;
  return true;
}

/** Nilai unik (tanpa membedakan huruf besar/kecil), diurutkan; tampilan memakai penulisan yang paling sering dipakai. */
export function distinct(values: string[]): string[] {
  const m = new Map<string, Map<string, number>>();
  for (const v of values) {
    const t = v.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const k = norm(t);
    const spellings = m.get(k) ?? new Map<string, number>();
    spellings.set(t, (spellings.get(t) ?? 0) + 1);
    m.set(k, spellings);
  }
  return [...m.values()].map((s) => [...s.entries()].sort((a, b) => b[1] - a[1])[0][0]).sort((a, b) => a.localeCompare(b, "id"));
}
