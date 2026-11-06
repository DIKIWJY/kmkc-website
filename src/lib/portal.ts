/**
 * Dialog, menu, select, tooltip, dan lembar Radix biasanya dirender di <body>, di luar pembungkus admin.
 * Tema admin (warna, radius, mode gelap) hanya berlaku di dalam #admin-root, jadi semua portal diarahkan ke sana.
 * Dibaca saat portal dibuka (di browser), bukan saat render server.
 */
export const ADMIN_ROOT_ID = "admin-root";

export function portalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.getElementById(ADMIN_ROOT_ID) ?? undefined;
}
