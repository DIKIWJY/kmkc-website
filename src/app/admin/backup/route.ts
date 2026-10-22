import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const TABLES = ["site_settings", "periods", "divisions", "members", "programs", "events", "gallery", "articles", "contact_messages", "registrations"] as const;

/** Unduh cadangan seluruh konten sebagai satu berkas JSON. Hanya untuk admin. */
export async function GET() {
  const { supabase, email } = await requireAdmin();

  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), exported_by: email, version: 1 };
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*");
    // tabel opsional (mis. events di database lama) dilewati, bukan menggagalkan cadangan
    out[t] = error ? { error: error.message } : data;
  }
  await supabase.from("audit_log").insert({ user_email: email, action: "mengunduh", entity: "Cadangan", label: "seluruh data (JSON)" });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kmkc-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
