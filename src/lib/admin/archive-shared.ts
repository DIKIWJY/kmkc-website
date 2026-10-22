/** Definisi bagian laporan arsip (dipakai form di klien dan halaman laporan di server). */
export const ARCHIVE_SECTIONS = [
  { key: "profil", label: "Profil organisasi", desc: "Nama, visi-misi, sejarah, kontak" },
  { key: "pengurus", label: "Kepengurusan", desc: "Daftar pengurus dan jabatannya" },
  { key: "program", label: "Program kerja", desc: "Seluruh program beserta status" },
  { key: "agenda", label: "Agenda", desc: "Kegiatan terjadwal" },
  { key: "berita", label: "Berita & artikel", desc: "Daftar berita, opsional dengan isi lengkap" },
  { key: "galeri", label: "Galeri", desc: "Daftar foto kegiatan, opsional dengan gambar" },
  { key: "pendaftar", label: "Pendaftar anggota", desc: "Data, alasan bergabung, dan bukti follow Instagram" },
  { key: "pesan", label: "Pesan masuk", desc: "Pesan dari formulir kontak" },
  { key: "statistik", label: "Statistik pengunjung", desc: "Ringkasan 30 hari terakhir" },
] as const;

export type ArchiveKey = (typeof ARCHIVE_SECTIONS)[number]["key"];

export interface ArchiveOptions {
  sections: ArchiveKey[];
  from: string; // YYYY-MM-DD atau ""
  to: string;
  proofs: boolean; // sertakan gambar bukti follow
  fullText: boolean; // isi lengkap berita
  photos: boolean; // gambar galeri
  auto: boolean; // langsung buka dialog cetak
}

const ALL = ARCHIVE_SECTIONS.map((s) => s.key) as ArchiveKey[];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseArchive(sp: Record<string, string | string[] | undefined>): ArchiveOptions {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const picked = one("s").split(",").filter((k): k is ArchiveKey => (ALL as string[]).includes(k));
  const from = DATE.test(one("from")) ? one("from") : "";
  const to = DATE.test(one("to")) ? one("to") : "";
  return {
    sections: picked.length ? ALL.filter((k) => picked.includes(k)) : ALL,
    from, to,
    proofs: one("proofs") !== "0",
    fullText: one("full") === "1",
    photos: one("photos") === "1",
    auto: one("auto") === "1",
  };
}

export function archiveQuery(o: ArchiveOptions): string {
  const q = new URLSearchParams();
  q.set("s", o.sections.join(","));
  if (o.from) q.set("from", o.from);
  if (o.to) q.set("to", o.to);
  q.set("proofs", o.proofs ? "1" : "0");
  if (o.fullText) q.set("full", "1");
  if (o.photos) q.set("photos", "1");
  if (o.auto) q.set("auto", "1");
  return q.toString();
}

export const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};
