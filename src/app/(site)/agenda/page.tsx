import type { Metadata } from "next";
import Agenda from "@/components/Agenda";
import PageEmpty from "@/components/PageEmpty";
import { getAgenda } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description: "Jadwal kegiatan KMKC yang akan datang dan arsip kegiatan yang sudah terlaksana.",
  alternates: { canonical: "/agenda" },
};

export default async function AgendaPage() {
  const { upcoming, past } = await getAgenda();
  if (upcoming.length === 0 && past.length === 0) return <PageEmpty title="Agenda Kegiatan" text="Belum ada agenda. Pantau terus halaman ini." />;
  return (
    <div className="pt-16 lg:pt-20">
      <Agenda page events={upcoming} past={past} />
    </div>
  );
}
