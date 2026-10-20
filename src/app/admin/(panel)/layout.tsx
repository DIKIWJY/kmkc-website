import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = { title: "Admin | KMKC", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, email } = await requireAdmin();
  const { count } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false);
  return (
    <ToastProvider>
      <Sidebar email={email} unread={count ?? 0}>{children}</Sidebar>
    </ToastProvider>
  );
}
