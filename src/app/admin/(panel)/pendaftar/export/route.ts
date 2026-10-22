import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const COLS: [string, string][] = [
  ["created_at", "Waktu daftar"], ["full_name", "Nama lengkap"], ["phone", "WhatsApp"], ["email", "Email"], ["village", "Desa asal"],
  ["batch", "Angkatan"], ["campus", "Perguruan tinggi"], ["major", "Program studi"], ["message", "Alasan bergabung"], ["follow_proof", "Bukti follow IG"], ["fee_amount", "Nominal HTM (Rp)"], ["payment_proof", "Bukti bayar HTM"], ["status", "Status"], ["note", "Catatan"],
];


// Cegah "CSV injection": sel yang diawali = + - @ dianggap rumus oleh Excel/Sheets.
const cell = (v: unknown) => {
  let t = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
};

/** Unduh seluruh pendaftar sebagai CSV (UTF-8 + BOM agar Excel membaca aksara dengan benar). Hanya admin. */
export async function GET() {
  const { supabase, email } = await requireAdmin();
  const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
  if (error) return new Response("Gagal mengambil data pendaftar.", { status: 500 });

  const lines = [COLS.map(([, h]) => cell(h)).join(",")];
  for (const r of (data ?? []) as Record<string, unknown>[]) lines.push(COLS.map(([k]) => cell(k === "follow_proof" || k === "payment_proof" ? (r[k] ? "Ada" : "Tidak ada") : r[k])).join(","));
  await supabase.from("audit_log").insert({ user_email: email, action: "mengunduh", entity: "Pendaftar", label: `${data?.length ?? 0} baris (CSV)` });

  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pendaftar-kmkc-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
