"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface RegisterState {
  ok?: boolean;
  demo?: boolean;
  error?: string;
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

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
    message: String(formData.get("message") ?? "").trim().slice(0, 1000),
  };

  if (!row.full_name) return { error: "Nama lengkap wajib diisi." };
  if (row.phone.replace(/\D/g, "").length < 8) return { error: "Nomor WhatsApp tidak valid." };
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return { error: "Format email tidak valid." };

  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const { error } = await createPublicClient().from("registrations").insert(row);
  if (error) return { error: "Pendaftaran gagal dikirim. Coba lagi sebentar lagi." };
  return { ok: true };
}
