import type { NextConfig } from "next";

// Foto dari Supabase Storage dioptimasi otomatis (AVIF/WebP + ukuran responsif) oleh Vercel.
const supabase = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return [{ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: supabase, formats: ["image/avif", "image/webp"], minimumCacheTTL: 60 * 60 * 24 * 30 },
  // Alias yang mudah diingat → rute sebenarnya. /login adalah jalan pintas masuk admin.
  async redirects() {
    const to = (destination: string, ...sources: string[]) => sources.map((source) => ({ source, destination, permanent: false }));
    return [
      ...to("/admin/login", "/login", "/masuk", "/admin-login"),
      ...to("/tentang", "/sejarah", "/visi-misi", "/about"),
      ...to("/kepengurusan", "/struktur", "/pengurus"),
      ...to("/program-kerja", "/program"),
      ...to("/galeri", "/gallery"),
      ...to("/kontak", "/contact", "/hubungi-kami"),
      ...to("/daftar", "/gabung", "/register"),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Admin tidak boleh di-embed (anti-clickjacking) dan tidak boleh di-cache
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
