import Image from "next/image";

interface LogoProps {
  /** Sisi logo dalam px (logo berbentuk lingkaran, ditampilkan apa adanya tanpa kotak/latar). */
  size?: number;
  /** Mode hitam-putih; kembali berwarna saat di-hover. Tanpa ini logo tampil berwarna murni. */
  mono?: boolean;
  priority?: boolean;
  alt?: string;
  className?: string;
}

/** Logo organisasi (public/logo.png). Ganti berkas itu untuk mengganti logo di seluruh sistem. */
export default function Logo({ size = 48, mono = false, priority = false, alt = "Logo KMKC", className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 select-none ${mono ? "grayscale opacity-80 transition duration-300 hover:grayscale-0 hover:opacity-100" : ""} ${className}`}
    />
  );
}
