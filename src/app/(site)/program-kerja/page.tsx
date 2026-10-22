import type { Metadata } from "next";
import ProgramKerja from "@/components/ProgramKerja";
import PageEmpty from "@/components/PageEmpty";
import { getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Program Kerja",
  description: "Program kerja dan kegiatan KMKC untuk mengembangkan anggota dan memberi manfaat bagi masyarakat Cempaka.",
  alternates: { canonical: "/program-kerja" },
};

export default async function ProgramPage() {
  const { programs } = await getSiteData();
  if (programs.length === 0) return <PageEmpty title="Program Kerja" text="Program kerja belum ditambahkan. Silakan kembali lagi nanti." />;
  return (
    <div className="pt-16 lg:pt-20 [&>section]:bg-transparent">
      <ProgramKerja page programs={programs} />
    </div>
  );
}
