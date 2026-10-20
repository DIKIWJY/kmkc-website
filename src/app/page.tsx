import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import History from "@/components/History";
import VisiMisi from "@/components/VisiMisi";
import Kepengurusan from "@/components/Kepengurusan";
import ProgramKerja from "@/components/ProgramKerja";
import Agenda from "@/components/Agenda";
import Gallery from "@/components/Gallery";
import GalleryArchive from "@/components/GalleryArchive";
import Berita from "@/components/Berita";
import Kontak from "@/components/Kontak";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import JsonLd from "@/components/JsonLd";
import { getSiteData } from "@/lib/data";
import type { GalleryItem } from "@/lib/types";
import { splitGallery } from "@/lib/gallery";
import { SITE_URL } from "@/lib/supabase/env";

/** Strip foto hero: hanya foto yang ditandai "Strip foto di beranda" (maks. 5). Kurang dari 3 → strip disembunyikan. */
function heroPhotos(gallery: GalleryItem[]): string[] {
  return gallery.filter((g) => g.featured && g.image_url).slice(0, 5).map((g) => g.image_url);
}

// ISR: halaman statis, disegarkan otomatis tiap 60 detik + langsung saat admin menyimpan perubahan
export const revalidate = 60;

export default async function Home() {
  const { settings: s, members, programs, gallery, articles, events } = await getSiteData();
  const { recent, years } = splitGallery(gallery);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: s.full_name || s.name,
          alternateName: s.name,
          url: SITE_URL,
          email: s.email || undefined,
          foundingDate: s.timeline.map((t) => /\b(19|20)\d{2}\b/.exec(t.date)?.[0]).find(Boolean),
          logo: `${SITE_URL}/logo.png`,
          sameAs: [s.instagram, s.tiktok, s.youtube].filter(Boolean),
        }}
      />
      <Navbar name={s.name} />
      <main id="konten">
        <Hero
          name={s.name}
          fullName={s.full_name}
          tagline={s.tagline}
          stats={s.stats}
          photos={heroPhotos(gallery)}
          nextEvent={events[0] ? { title: events[0].title, date: events[0].event_date } : null}
        />
        <About about={s.about} photo={s.about_photo} name={s.name} />
        <History name={s.name} history={s.history} timeline={s.timeline} founders={s.founders} />
        <VisiMisi vision={s.vision} mission={s.mission} />
        <Kepengurusan members={members} />
        <ProgramKerja programs={programs} />
        <Agenda events={events} />
        <Gallery items={recent} />
        <GalleryArchive years={years} />
        <Berita articles={articles} />
        <Kontak
          email={s.email}
          phone={s.phone}
          address={s.address}
          instagram={s.instagram}
          tiktok={s.tiktok}
          youtube={s.youtube}
          whatsapp={s.whatsapp}
        />
      </main>
      <Footer name={s.name} fullName={s.full_name} />
      <BackToTop />
      <WhatsAppButton number={s.whatsapp} name={s.name} />
    </>
  );
}
