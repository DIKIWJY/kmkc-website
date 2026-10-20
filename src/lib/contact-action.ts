"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface ContactState {
  ok?: boolean;
  demo?: boolean;
  error?: string;
}

/** Server Action publik untuk form kontak. Dilindungi honeypot, waktu minimal isi form, validasi panjang, dan RLS. */
export async function sendMessage(_prev: ContactState | undefined, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honey = String(formData.get("website") ?? "");
  const startedAt = Number(formData.get("t") ?? 0);

  // Bot: honeypot terisi / form dikirim < 2 detik → pura-pura sukses
  if (honey || (startedAt && Date.now() - startedAt < 2000)) return { ok: true };

  if (!name || !email || !message) return { error: "Nama, email, dan pesan wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Format email tidak valid." };
  if (name.length > 120 || subject.length > 200 || message.length > 5000) return { error: "Isian terlalu panjang." };

  if (!isSupabaseConfigured) return { ok: true, demo: true };

  const { error } = await createPublicClient().from("contact_messages").insert({ name, email, subject, message });
  if (error) return { error: "Pesan gagal dikirim. Coba lagi sebentar lagi." };
  return { ok: true };
}
