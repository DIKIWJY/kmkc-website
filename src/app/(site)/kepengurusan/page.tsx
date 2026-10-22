import type { Metadata } from "next";
import Kepengurusan from "@/components/Kepengurusan";
import PageEmpty from "@/components/PageEmpty";
import { getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Kepengurusan",
  description: "Struktur dan susunan pengurus KMKC, Keluarga Mahasiswa Kecamatan Cempaka.",
  alternates: { canonical: "/kepengurusan" },
};

export default async function KepengurusanPage() {
  const { members, org } = await getSiteData();
  if (members.length === 0) return <PageEmpty title="Kepengurusan" text="Susunan pengurus belum ditambahkan. Silakan kembali lagi nanti." />;
  return (
    <div className="pt-16 lg:pt-20">
      <Kepengurusan org={org} />
    </div>
  );
}
