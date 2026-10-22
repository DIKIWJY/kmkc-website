import type { Metadata } from "next";
import { getAdmin, getSupabase } from "@/lib/admin/guard";
import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin KMKC" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Verifikasi admin dan hitung pesan belum dibaca berjalan paralel (satu putaran jaringan, bukan dua).
  const [{ email }, unread] = await Promise.all([
    getAdmin(),
    getSupabase().then((sb) => sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false)).then((r) => r.count ?? 0),
  ]);
  return (
    <ToastProvider>
      <Sidebar email={email} unread={unread}>{children}</Sidebar>
    </ToastProvider>
  );
}
