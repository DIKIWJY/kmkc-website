import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import GalleryArchive from "@/components/GalleryArchive";
import PageEmpty from "@/components/PageEmpty";
import { getSiteData } from "@/lib/data";
import { splitGallery } from "@/lib/gallery";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Galeri Kegiatan",
  description: "Dokumentasi foto kegiatan KMKC dari tahun ke tahun.",
  alternates: { canonical: "/galeri" },
};

export default async function GaleriPage() {
  const { gallery } = await getSiteData();
  if (gallery.length === 0) return <PageEmpty title="Galeri Kegiatan" text="Foto kegiatan belum ditambahkan. Silakan kembali lagi nanti." />;
  const { recent, years } = splitGallery(gallery);
  return (
    <div className="pt-16 lg:pt-20">
      {recent.length > 0 ? <Gallery page items={recent} /> : <h1 className="sr-only">Galeri Kegiatan</h1>}
      <GalleryArchive years={years} />
    </div>
  );
}
