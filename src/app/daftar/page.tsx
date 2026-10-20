import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DaftarForm from "@/components/DaftarForm";
import { getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Daftar Anggota",
  description: "Mahasiswa asal Kecamatan Cempaka? Daftar dan bergabung menjadi bagian keluarga besar KMKC.",
  alternates: { canonical: "/daftar" },
};

export default async function DaftarPage() {
  const { settings: s } = await getSiteData();
  return (
    <>
      <Navbar name={s.name} />
      <main id="konten" className="pt-36 pb-24 flex-1">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 grid lg:grid-cols-[5fr_6fr] gap-12 lg:gap-20">
          <div className="lg:sticky lg:top-32 self-start">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-accent">Gabung bersama kami</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary-dark leading-[1.08]">Daftar anggota {s.name}</h1>
            <p className="mt-5 text-neutral-500 text-lg leading-relaxed">
              Kamu mahasiswa asal Kecamatan Cempaka? Isi formulir singkat ini. Pengurus akan menghubungimu lewat WhatsApp untuk langkah berikutnya.
            </p>
            <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
              {[["Gratis", "Tanpa biaya pendaftaran"], ["Respons", "Biasanya dalam beberapa hari"], ["Data", "Hanya dipakai pengurus untuk keperluan organisasi"]].map(([k, v]) => (
                <div key={k} className="flex gap-6 py-3.5">
                  <dt className="w-20 shrink-0 font-semibold text-primary-dark">{k}</dt>
                  <dd className="text-neutral-500">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="pt-2">
            <DaftarForm name={s.name} />
          </div>
        </div>
      </main>
      <Footer name={s.name} fullName={s.full_name} />
    </>
  );
}
