import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import ProgramKerja from "@/components/ProgramKerja";
import Agenda from "@/components/Agenda";
import Gallery from "@/components/Gallery";
import Berita from "@/components/Berita";
import CtaJoin from "@/components/CtaJoin";
import JsonLd from "@/components/JsonLd";
import { getSiteData } from "@/lib/data";
import type { GalleryItem } from "@/lib/types";
import { splitGallery } from "@/lib/gallery";
import { SITE_URL } from "@/lib/supabase/env";

/** Strip foto hero: hanya foto yang ditandai "Sorotan" (maks. 5). Kurang dari 3 → strip disembunyikan. */
function heroPhotos(gallery: GalleryItem[]): string[] {
  return gallery.filter((g) => g.featured && g.image_url).slice(0, 5).map((g) => g.image_url);
}

// ISR: halaman statis, disegarkan otomatis tiap 60 detik + langsung saat admin menyimpan perubahan
export const revalidate = 60;

export default async function Home() {
  const { settings: s, programs, gallery, articles, events } = await getSiteData();
  const { recent } = splitGallery(gallery);

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
      <Hero
        name={s.name}
        fullName={s.full_name}
        tagline={s.tagline}
        stats={s.stats}
        photos={heroPhotos(gallery)}
        nextEvent={events[0] ? { title: events[0].title, date: events[0].event_date } : null}
      />
      <Marquee fullName={s.full_name || s.name} />
      <div className="relative -mt-10 rounded-t-[2.5rem] bg-white sm:-mt-14 sm:rounded-t-[3.5rem]">
        <About about={s.about} photo={s.about_photo} name={s.name} />
      </div>
      <ProgramKerja programs={programs} limit={4} />
      <Agenda events={events} />
      <Gallery items={recent} />
      <Berita articles={articles.slice(0, 3)} />
      <CtaJoin name={s.name} />
    </>
  );
}
