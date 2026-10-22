/** Format rupiah: 25000 → "Rp25.000". */
export function rupiah(n: number): string {
  const v = Math.max(0, Math.trunc(Number(n) || 0));
  return "Rp" + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Ambil angka dari isian bebas ("25.000", "Rp 25000") → 25000. Dibatasi 0–10 juta. */
export function parseRupiah(v: unknown): number {
  const n = Number(String(v ?? "").replace(/\D/g, "")) || 0;
  return Math.min(10_000_000, Math.max(0, n));
}
