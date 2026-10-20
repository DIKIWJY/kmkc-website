import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllArticles, getSiteData } from "@/lib/data";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeritaIndex from "@/components/BeritaIndex";
import SectionHeading from "@/components/ui/SectionHeading";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Berita & Artikel",
  description: "Semua berita, pengumuman, dan cerita kegiatan terbaru dari KMKC.",
  alternates: { canonical: "/berita" },
};

export default async function BeritaPage() {
  const [articles, { settings }] = await Promise.all([getAllArticles(), getSiteData()]);
  return (
    <>
      <Navbar name={settings.name} home />
      <main id="konten" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline mb-8">
            <ArrowLeft size={16} /> Kembali ke beranda
          </Link>
          <SectionHeading title="Berita & Artikel" subtitle="Cerita dan informasi terbaru dari kegiatan kami." className="mb-12" />
          {articles.length === 0 ? <p className="text-neutral-400 py-20 text-center">Belum ada berita terbit.</p> : <BeritaIndex articles={articles} />}
        </div>
      </main>
      <Footer name={settings.name} fullName={settings.full_name} />
    </>
  );
}
