import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdmin, getSupabase } from "@/lib/admin/guard";
import AdminShell from "@/components/admin/shell/AdminShell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin KMKC" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  // Verifikasi admin dan hitung lencana sidebar berjalan paralel (satu putaran jaringan, bukan beberapa).
  const [{ email }, unread, regOpen] = await Promise.all([
    getAdmin(),
    getSupabase().then((sb) => sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false)).then((r) => r.count ?? 0),
    getSupabase().then((sb) => sb.from("site_settings").select("registration_open").eq("id", 1).maybeSingle()).then((r) => (r.data as { registration_open?: boolean } | null)?.registration_open !== false),
  ]);

  return (
    <AdminShell
      email={email}
      unread={unread}
      regOpen={regOpen}
      defaultOpen={jar.get("sidebar_state")?.value !== "false"}
      initialTheme={jar.get("admin-theme")?.value === "dark" ? "dark" : "light"}
    >
      {children}
    </AdminShell>
  );
}
