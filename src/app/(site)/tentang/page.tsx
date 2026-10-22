import type { Metadata } from "next";
import About from "@/components/About";
import History from "@/components/History";
import VisiMisi from "@/components/VisiMisi";
import { getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Profil, sejarah, visi dan misi KMKC, Keluarga Mahasiswa Kecamatan Cempaka.",
  alternates: { canonical: "/tentang" },
};

export default async function TentangPage() {
  const { settings: s } = await getSiteData();
  return (
    <>
      <div className="pt-16 lg:pt-20">
        <About page about={s.about} photo={s.about_photo} name={s.name} />
      </div>
      <History name={s.name} history={s.history} timeline={s.timeline} founders={s.founders} />
      <VisiMisi vision={s.vision} mission={s.mission} />
    </>
  );
}
