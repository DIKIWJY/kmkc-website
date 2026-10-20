import type { SupabaseClient } from "@supabase/supabase-js";

export interface DayStat { day: string; views: number; visitors: number }
export interface KeyStat { key: string; views: number }
export interface Stats {
  ok: boolean;
  daily: DayStat[]; // 180 hari terakhir, urut naik, hari kosong sudah diisi 0
  devices: KeyStat[];
  sources: KeyStat[];
  pages: KeyStat[];
}

const DAYS = 180;
const wibDay = (offset: number) => new Date(Date.now() + 7 * 3600e3 - offset * 86400e3).toISOString().slice(0, 10);

/** Mengambil ringkasan statistik lewat RPC admin_stats. Gagal (tabel/fungsi belum dibuat) → ok:false. */
export async function getStats(supabase: SupabaseClient): Promise<Stats> {
  const empty: Stats = { ok: false, daily: [], devices: [], sources: [], pages: [] };
  try {
    const { data, error } = await supabase.rpc("admin_stats", { p_days: DAYS });
    if (error || !data) return empty;
    const map = new Map<string, DayStat>((data.daily as DayStat[]).map((d) => [d.day, d]));
    const daily: DayStat[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const day = wibDay(i);
      daily.push(map.get(day) ?? { day, views: 0, visitors: 0 });
    }
    return { ok: true, daily, devices: data.devices ?? [], sources: data.sources ?? [], pages: data.pages ?? [] };
  } catch {
    return empty;
  }
}
