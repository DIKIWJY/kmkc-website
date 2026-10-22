import type { Metadata } from "next";
import Kontak from "@/components/Kontak";
import { getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi pengurus KMKC untuk pertanyaan, saran, atau kolaborasi.",
  alternates: { canonical: "/kontak" },
};

export default async function KontakPage() {
  const { settings: s } = await getSiteData();
  return (
    <div className="pt-16 lg:pt-20 [&>section]:bg-transparent">
      <Kontak page email={s.email} phone={s.phone} address={s.address} instagram={s.instagram} tiktok={s.tiktok} youtube={s.youtube} whatsapp={s.whatsapp} />
    </div>
  );
}
