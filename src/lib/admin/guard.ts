import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Pastikan request datang dari admin sungguhan:
 *  1. ada session Supabase yang valid (diverifikasi ke server Auth, bukan sekadar cookie)
 *  2. user terdaftar di tabel `admins`
 * Dipanggil di layout panel DAN di setiap Server Action (defense in depth).
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const { data: row } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    redirect("/admin/login?e=forbidden");
  }
  return { supabase, user: data.user, email: data.user.email ?? "" };
}
