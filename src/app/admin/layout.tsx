import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_ROOT_ID } from "@/lib/portal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Pembungkus seluruh area admin. Tema (token warna shadcn selaras KMKC) hanya aktif di dalam .adm — lihat admin-theme.css.
 * Mode gelap dibaca dari cookie agar halaman langsung tampil benar, tanpa kedip.
 */
export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const dark = (await cookies()).get("admin-theme")?.value === "dark";
  return (
    <div id={ADMIN_ROOT_ID} className={cn("adm", dark && "dark")}>
      {children}
    </div>
  );
}
