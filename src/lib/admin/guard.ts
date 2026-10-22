import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Satu client Supabase per request (layout dan halaman berbagi koneksi yang sama). */
export const getSupabase = cache(createServerSupabase);

type Identity = { id: string; email: string };

/** Identitas dari klaim JWT: diverifikasi lokal (tanpa perjalanan jaringan) bila project memakai kunci asimetris; otomatis jatuh ke server Auth jika tidak. */
async function identityFromSession(supabase: Awaited<ReturnType<typeof getSupabase>>): Promise<Identity | null> {
  try {
    const { data } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    if (sub) return { id: sub, email: String((data.claims as { email?: string }).email ?? "") };
  } catch {
    /* lanjut ke verifikasi server */
  }
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}

async function ensureAdmin(supabase: Awaited<ReturnType<typeof getSupabase>>, who: Identity | null) {
  if (!who) redirect("/admin/login");
  const { data: row } = await supabase.from("admins").select("user_id").eq("user_id", who.id).maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    redirect("/admin/login?e=forbidden");
  }
  return { supabase, email: who.email };
}

/**
 * Untuk MEMBACA halaman admin (layout + halaman). Cepat: identitas dari klaim JWT + 1 query ke tabel `admins`,
 * dan hanya dihitung sekali per request. Akses data tetap dijaga RLS di database.
 */
export const getAdmin = cache(async () => {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = await getSupabase();
  return ensureAdmin(supabase, await identityFromSession(supabase));
});

/**
 * Untuk MENGUBAH data (Server Action) dan mengunduh berkas: verifikasi ketat ke server Auth (bukan sekadar cookie/klaim),
 * lalu pastikan user terdaftar di tabel `admins`. Defense in depth bersama proxy dan RLS.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const who = data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
  return ensureAdmin(supabase, who);
}
