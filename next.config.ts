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
