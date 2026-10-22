import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import Motion from "@/components/Motion";
import Intro from "@/components/Intro";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSiteData } from "@/lib/data";

/** Kerangka seluruh halaman publik: navbar tetap terpasang saat berpindah halaman (tanpa render ulang), footer, dan tombol bantu. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings: s } = await getSiteData();
  return (
    <>
      <Intro />
      <Motion />
      <a href="#konten" className="skip-link">Lompat ke konten</a>
      <div className="scroll-progress" aria-hidden />
      <Navbar name={s.name} />
      <main id="konten" className="flex-1">{children}</main>
      <Footer {...s} />
      <BackToTop />
      <WhatsAppButton number={s.whatsapp} name={s.name} />
    </>
  );
}
