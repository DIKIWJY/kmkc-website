"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PROOF_NAME } from "@/lib/proof";
import { sampleSettings } from "@/lib/sample-data";

export interface RegisterState {
  ok?: boolean;
  demo?: boolean;
  /** Pendaftar membayar HTM: pesan sukses menyebut bukti pembayaran yang diterima. */
  paid?: boolean;
  error?: string;
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** HTM yang berlaku saat ini, dibaca dari database (bukan dari kiriman formulir) agar tidak bisa dipalsukan. null = kolom belum ada di database. */
async function currentFee(): Promise<number | null> {
  if (!isSupabaseConfigured) return sampleSettings.registration_fee;
  const { data, error } = await createPublicClient().from("site_settings").select("registration_fee").eq("id", 1).maybeSingle();
  if (error) return null;
  return Math.max(0, Number((data as { registration_fee?: number } | null)?.registration_fee ?? 0) || 0);
}

/** Server Action publik: pendaftaran anggota baru. Honeypot + waktu minimal + validasi; RLS hanya mengizinkan INSERT status "baru". */
export async function registerMember(_prev: RegisterState | undefined, formData: FormData): Promise<RegisterState> {
  const honey = String(formData.get("website") ?? "");
  const startedAt = Number(formData.get("t") ?? 0);
  if (honey || (startedAt && Date.now() - startedAt < 3000)) return { ok: true };

  const row = {
    full_name: clean(formData.get("full_name"), 120),
    phone: clean(formData.get("phone"), 24).replace(/[^\d+\s-]/g, ""),
    email: clean(formData.get("email"), 200),
    village: clean(formData.get("village"), 120),
    campus: clean(formData.get("campus"), 160),
    major: clean(formData.get("major"), 160),
    batch: clean(formData.get("batch"), 20),
    message: String(formData.get("message") ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1000),
    follow_proof: clean(formData.get("follow_proof"), 80),
  };
  const paymentProof = clean(formData.get("payment_proof"), 80);

  if (!row.full_name) return { error: "Nama lengkap wajib diisi." };
  if (row.phone.replace(/\D/g, "").length < 8) return { error: "Nomor WhatsApp tidak valid." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return { error: "Email wajib diisi dengan format yang benar." };
  if (!row.village) return { error: "Desa asal wajib diisi." };
  if (!/^\d{4}$/.test(row.batch)) return { error: "Angkatan diisi dengan 4 digit tahun, contoh 2025." };
  if (!row.campus) return { error: "Perguruan tinggi wajib diisi." };
  if (!row.major) return { error: "Program studi wajib diisi." };
  if (row.message.length < 20) return { error: "Alasan bergabung minimal 20 karakter agar pengurus bisa mengenalmu." };
  if (!PROOF_NAME.test(row.follow_proof)) return { error: "Unggah tangkapan layar bukti follow Instagram KMKC terlebih dahulu." };

  const fee = await currentFee();
  const pays = (fee ?? 0) > 0;
  if (pays && !PROOF_NAME.test(paymentProof)) return { error: "Unggah bukti pembayaran HTM terlebih dahulu." };

  if (!isSupabaseConfigured) return { ok: true, demo: true, paid: pays };

  // fee === null: database lama tanpa kolom HTM → simpan seperti biasa (tanpa kolom pembayaran).
  const payload = fee === null ? row : { ...row, payment_proof: pays ? paymentProof : "", fee_amount: pays ? fee : 0 };
  const { error } = await createPublicClient().from("registrations").insert(payload);
  if (error) {
    if (error.code === "PGRST204" || error.code === "42703") return { error: "Pendaftaran belum bisa menerima data baru. Pengurus perlu memperbarui database (jalankan ulang schema.sql)." };
    if (error.code === "42501") return { error: pays ? "Pendaftaran ditolak. Pastikan bukti pembayaran HTM sudah terunggah, lalu coba lagi." : "Pendaftaran ditolak. Muat ulang halaman lalu coba lagi." };
    return { error: "Pendaftaran gagal dikirim. Coba lagi sebentar lagi." };
  }
  return { ok: true, paid: pays };
}
