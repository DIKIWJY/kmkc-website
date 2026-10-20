import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "KMKC — Keluarga Mahasiswa Kecamatan Cempaka";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gambar pratinjau saat tautan dibagikan (WhatsApp, Instagram, dll). */
export default async function OpengraphImage() {
  // Rute ini dirender statis saat build, jadi membaca berkas dari repo aman (tidak berjalan di runtime).
  const logo = await readFile(join(process.cwd(), "src/app/_assets/logo-og.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 90px", color: "white",
          background: "linear-gradient(135deg,#0f2a5c 0%,#1e4fa3 55%,#0ea5e9 100%)",
        }}
      >
        <img src={logoSrc} width={330} height={330} alt="" style={{ borderRadius: 330, marginRight: 70 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 8, opacity: 0.7, display: "flex" }}>WEBSITE RESMI</div>
          <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 1, letterSpacing: -6, display: "flex" }}>KMKC</div>
          <div style={{ fontSize: 38, marginTop: 12, display: "flex", maxWidth: 560 }}>Keluarga Mahasiswa Kecamatan Cempaka</div>
        </div>
        <div style={{ position: "absolute", right: -120, top: -120, width: 460, height: 460, borderRadius: 460, background: "rgba(255,255,255,0.08)", display: "flex" }} />
        <div style={{ position: "absolute", right: 120, bottom: -180, width: 360, height: 360, borderRadius: 360, background: "rgba(255,255,255,0.07)", display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
