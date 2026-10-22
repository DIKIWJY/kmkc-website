import type { Metadata } from "next";
import { getAllArticles } from "@/lib/data";
import BeritaIndex from "@/components/BeritaIndex";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Berita & Artikel",
  description: "Semua berita, pengumuman, dan cerita kegiatan terbaru dari KMKC.",
  alternates: { canonical: "/berita" },
};

export default async function BeritaPage() {
  const articles = await getAllArticles();
  return (
    <div className="pb-24 pt-28 sm:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-10">
        <header className="mb-8 sm:mb-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">Pusat informasi</p>
          <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-primary-dark sm:text-6xl">Berita &amp; Artikel</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-neutral-500">Kabar, pengumuman, dan cerita kegiatan terbaru dari keluarga besar KMKC.</p>
        </header>
        {articles.length === 0 ? <p className="py-24 text-center text-neutral-400">Belum ada berita terbit.</p> : <BeritaIndex articles={articles} />}
      </div>
    </div>
  );
}
