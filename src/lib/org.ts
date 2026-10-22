import type { Division, Member, Period } from "./types";

/** Satu bidang/departemen beserta pengurusnya (sudah berurutan). */
export interface OrgDivision {
  name: string;
  description: string;
  members: Member[];
}

/** Satu periode kepengurusan: susunan bidangnya bisa berbeda dengan periode lain. */
export interface OrgPeriod {
  label: string;
  isCurrent: boolean;
  divisions: OrgDivision[];
}

/**
 * Menyusun pohon periode → bidang → pengurus dari tiga tabel datar.
 * Tahan data lama: pengurus yang bidang/periodenya belum terdaftar di tabel `divisions` / `periods`
 * tetap tampil (bidang ditambahkan di belakang), jadi website tidak kosong sebelum database diperbarui.
 */
export function buildOrg(members: Member[], periods: Period[], divisions: Division[]): OrgPeriod[] {
  const labels = new Map<string, boolean>(); // label → current
  for (const p of periods) labels.set(p.label, !!p.is_current);
  for (const m of members) if (!labels.has(m.period || DEFAULT_PERIOD)) labels.set(m.period || DEFAULT_PERIOD, false);
  for (const d of divisions) if (!labels.has(d.period)) labels.set(d.period, false);

  const sortedLabels = [...labels.keys()].sort((a, b) => b.localeCompare(a, "id", { numeric: true }));
  const hasCurrent = [...labels.values()].some(Boolean);

  return sortedLabels.map((label, i) => {
    const divs = divisions.filter((d) => d.period === label).sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name, "id"));
    const out: OrgDivision[] = divs.map((d) => ({ name: d.name, description: d.description ?? "", members: [] }));
    const byName = new Map(out.map((d) => [d.name, d]));
    const mine = members
      .filter((m) => (m.period || DEFAULT_PERIOD) === label)
      .sort((a, b) => a.order_index - b.order_index || a.created_at.localeCompare(b.created_at));
    for (const m of mine) {
      const name = m.division || "Umum";
      let d = byName.get(name);
      if (!d) { d = { name, description: "", members: [] }; byName.set(name, d); out.push(d); }
      d.members.push(m);
    }
    return { label, isCurrent: hasCurrent ? !!labels.get(label) : i === 0, divisions: out };
  });
}

export const DEFAULT_PERIOD = "2025/2026";

/** Periode yang ditampilkan secara bawaan di website. */
export const currentPeriod = (org: OrgPeriod[]): OrgPeriod | undefined => org.find((p) => p.isCurrent) ?? org[0];

/** Pola susunan siap pakai untuk periode baru. Bidang bisa diubah/ditambah/dihapus setelahnya. */
export const ORG_PRESETS = {
  kmkc: {
    label: "Susunan KMKC (Presidium + 6 departemen)",
    divisions: [
      { name: "Presidium", description: "Pimpinan inti KMKC" },
      { name: "Departemen Pendidikan", description: "" },
      { name: "Departemen PKMB", description: "" },
      { name: "Departemen Humas", description: "" },
      { name: "Departemen Medinfo", description: "" },
      { name: "Departemen Kewirausahaan", description: "" },
      { name: "Departemen Kesehatan", description: "" },
    ],
    /** Jabatan yang biasanya ada, dipakai sebagai saran pada formulir pengurus. */
    positions: {
      Presidium: ["Ketua Umum", "Wakil Ketua Umum 1", "Wakil Ketua Umum 2", "Sekretaris Umum 1", "Sekretaris Umum 2", "Bendahara Umum"],
    } as Record<string, string[]>,
  },
  kosong: { label: "Kosong (tambah bidang sendiri)", divisions: [] as { name: string; description: string }[], positions: {} as Record<string, string[]> },
} as const;

export type OrgPresetKey = keyof typeof ORG_PRESETS;

/** Saran jabatan untuk sebuah bidang: Presidium → jabatan inti; departemen → "Ketua <nama departemen>" lalu "Anggota"/"Sekretaris"/"Staf". */
export function positionSuggestions(division: string): string[] {
  const preset = ORG_PRESETS.kmkc.positions[division];
  if (preset) return preset;
  const lower = division.toLowerCase();
  const kind = lower.startsWith("departemen") ? "Departemen" : lower.startsWith("bidang") ? "Bidang" : lower.startsWith("divisi") ? "Divisi" : "";
  const rest = kind ? division.slice(kind.length).trim() : division;
  const head = kind ? `Ketua ${kind} ${rest}` : `Ketua ${division}`;
  return [head, `Wakil ${head}`, `Sekretaris ${kind || ""} ${rest}`.replace(/\s+/g, " ").trim(), "Anggota"];
}
