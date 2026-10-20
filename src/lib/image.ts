import { createBrowserSupabase } from "@/lib/supabase/browser";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

/** Perkecil + ubah ke WebP di browser sebelum diunggah (hemat kuota storage & loading cepat). */
export async function compressImage(file: File, maxSide = 1920, quality = 0.84): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung kompresi gambar.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", quality));
  if (!blob) throw new Error("Gagal memproses gambar.");
  return blob;
}

/** Kompres lalu unggah ke bucket `media`. Mengembalikan URL publik. */
export async function uploadImage(file: File, folder: string, maxSide = 1920): Promise<string> {
  const blob = await compressImage(file, maxSide);
  const supabase = createBrowserSupabase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message || "Upload gagal.");
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
