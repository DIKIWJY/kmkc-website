import { createBrowserSupabase } from "@/lib/supabase/browser";
import { PROOF_BUCKET, isSupabaseConfigured } from "@/lib/supabase/env";
import { compressImage } from "@/lib/image";

export const PROOF_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/;

/** Kompres tangkapan layar (±100–250 KB) lalu unggah ke bucket privat. Mengembalikan nama berkas (UUID.webp). */
export async function uploadProof(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Berkas harus berupa gambar (JPG, PNG, atau WebP).");
  if (file.size > 12 * 1024 * 1024) throw new Error("Ukuran gambar terlalu besar (maksimal 12 MB).");
  const blob = await compressImage(file, 1280, 0.8);
  const name = `${crypto.randomUUID()}.webp`;
  if (!isSupabaseConfigured) return name; // mode demo: tidak ada database
  const { error } = await createBrowserSupabase().storage.from(PROOF_BUCKET).upload(name, blob, { contentType: "image/webp", cacheControl: "3600" });
  if (error) throw new Error("Gagal mengunggah gambar. Coba lagi.");
  return name;
}
