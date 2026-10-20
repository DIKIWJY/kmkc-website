import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/montserrat";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./globals.css";
import Tracker from "@/components/Tracker";
import { SITE_URL } from "@/lib/supabase/env";

const title = "KMKC | Keluarga Mahasiswa Kecamatan Cempaka";
const description =
  "Website resmi KMKC — Keluarga Mahasiswa Kecamatan Cempaka. Kegiatan, kepengurusan, program kerja, galeri, dan kabar terbaru.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s | KMKC" },
  description,
  applicationName: "KMKC",
  openGraph: { type: "website", locale: "id_ID", siteName: "KMKC", title, description },
  twitter: { card: "summary_large_image", title, description },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export const viewport: Viewport = { themeColor: "#1e4fa3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <a href="#konten" className="skip-link">Lompat ke konten</a>
        <div className="scroll-progress" aria-hidden />
        {children}
        <Tracker />
        <Analytics />
      </body>
    </html>
  );
}
