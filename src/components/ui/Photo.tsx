import Image from "next/image";
import { SUPABASE_URL } from "@/lib/supabase/env";

const origin = (() => {
  try {
    return new URL(SUPABASE_URL).origin;
  } catch {
    return "";
  }
})();
// Optimizer Next.js tidak boleh menjangkau host lokal/privat, jadi hanya foto dari Supabase publik yang dioptimasi.
const optimizable = (src: string) => !!origin && !/^https?:\/\/(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0)/.test(origin) && src.startsWith(`${origin}/storage/`);

interface PhotoProps {
  src: string;
  alt: string;
  /** Lebar tampil sebenarnya — menentukan ukuran file yang diunduh browser. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Foto responsif: di Vercel diubah otomatis menjadi AVIF/WebP dengan ukuran pas (hemat ±70% data).
 * Induknya harus `relative` dan punya ukuran (mengisi seluruh induk, seperti background-size: cover).
 */
export default function Photo({ src, alt, sizes, priority = false, className = "" }: PhotoProps) {
  if (!optimizable(src)) {
    return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false} className={`absolute inset-0 w-full h-full object-cover ${className}`} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} draggable={false} className={`object-cover ${className}`} />;
}
