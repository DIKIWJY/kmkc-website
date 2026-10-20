import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KMKC — Keluarga Mahasiswa Kecamatan Cempaka",
    short_name: "KMKC",
    description: "Website resmi Keluarga Mahasiswa Kecamatan Cempaka.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e4fa3",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
