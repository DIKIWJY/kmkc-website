import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/plus-jakarta-sans";
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
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Menyalakan mode animasi sebelum cat pertama (tanpa kedip). Mati bila pengguna memilih "kurangi gerakan". */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('m');if(location.pathname==='/'&&!sessionStorage.getItem('kmkc-i')){sessionStorage.setItem('kmkc-i','1');d.classList.add('m-intro')}setTimeout(function(){if(!window.__m)d.classList.remove('m','m-intro')},5000)}catch(e){}})()",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Tracker />
        <Analytics />
      </body>
    </html>
  );
}
