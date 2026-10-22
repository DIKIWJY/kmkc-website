import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import DaftarForm from "@/components/DaftarForm";
import { getSiteData } from "@/lib/data";
import { gformEmbedUrl, isGoogleFormUrl } from "@/lib/gform";
import { IconInstagram } from "@/components/icons/SocialIcons";
import { rupiah } from "@/lib/money";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Daftar Anggota",
  description: "Mahasiswa asal Kecamatan Cempaka? Daftar dan bergabung menjadi bagian keluarga besar KMKC.",
  alternates: { canonical: "/daftar" },
};

export default async function DaftarPage() {
  const { settings: s } = await getSiteData();
  const open = s.registration_open !== false;
  const useGform = s.registration_mode === "gform" && isGoogleFormUrl(s.gform_url);
  const embed = useGform ? gformEmbedUrl(s.gform_url) : null;

  const fee = !useGform ? Math.max(0, Number(s.registration_fee) || 0) : 0;
  const facts: [string, string][] = [
    ...(fee > 0 ? ([["HTM", `${rupiah(fee)}, dibayar saat mendaftar dengan mengunggah bukti transfer`]] as [string, string][]) : []),
    ["Respons", "Biasanya dalam beberapa hari"],
    ["Data", "Hanya dipakai pengurus untuk keperluan organisasi"],
  ];

  return (
    <div className="pt-32 sm:pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 grid lg:grid-cols-[5fr_6fr] gap-12 lg:gap-20">
        <div className="lg:sticky lg:top-32 self-start">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-accent">{open ? "Gabung bersama kami" : "Informasi pendaftaran"}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary-dark leading-[1.08]">
            {open ? <>Daftar anggota {s.name}</> : <>Pendaftaran sedang ditutup</>}
          </h1>
          <p className="mt-5 text-neutral-500 text-lg leading-relaxed">
            {open
              ? `Kamu mahasiswa asal Kecamatan Cempaka? Isi formulir ini${fee > 0 ? ", unggah bukti follow dan bukti pembayaran HTM" : ""}. Pengurus akan menghubungimu lewat WhatsApp untuk langkah berikutnya.`
              : s.registration_note || "Pendaftaran anggota baru belum dibuka. Pantau Instagram kami untuk informasi pembukaan berikutnya."}
          </p>
          {open && s.registration_note && <p className="mt-4 rounded-2xl bg-surface px-5 py-4 text-[15px] leading-relaxed text-primary-dark">{s.registration_note}</p>}
          {open && (
            <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex gap-6 py-3.5">
                  <dt className="w-20 shrink-0 font-semibold text-primary-dark">{k}</dt>
                  <dd className="text-neutral-500">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="pt-2">
          {!open ? (
            <div className="rounded-3xl bg-surface p-8 sm:p-10">
              <Lock size={28} className="text-accent" />
              <p className="mt-5 text-xl font-bold text-primary-dark">Belum ada pendaftaran yang dibuka</p>
              <p className="mt-2 leading-relaxed text-neutral-500">Kamu tetap bisa bertanya lewat halaman kontak atau mengikuti kabar terbaru di Instagram.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {s.instagram && (
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-dark px-6 text-sm font-semibold text-white hover:bg-primary transition-colors">
                    <IconInstagram size={16} /> Instagram
                  </a>
                )}
                <Link href="/kontak" className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-primary ring-1 ring-black/10 hover:bg-white transition-colors">Hubungi kami</Link>
              </div>
            </div>
          ) : useGform ? (
            <div>
              <a href={s.gform_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-dark px-7 text-sm font-semibold text-white hover:bg-primary transition-colors">
                Buka formulir pendaftaran <ArrowUpRight size={16} />
              </a>
              <p className="mt-3 text-sm text-neutral-500">Formulir dibuka lewat Google Form. Pastikan kamu sudah follow Instagram {s.name} bila diminta.</p>
              {embed && (
                <iframe
                  src={embed} title={`Formulir pendaftaran ${s.name}`} loading="lazy"
                  className="mt-8 h-[1100px] w-full rounded-2xl border border-black/10 bg-white"
                />
              )}
            </div>
          ) : (
            <DaftarForm name={s.name} instagramUrl={s.instagram} fee={fee} paymentInfo={s.payment_info} paymentQr={s.payment_qr} />
          )}
        </div>
      </div>
    </div>
  );
}
