import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Ajakan bergabung di akhir beranda. */
export default function CtaJoin({ name }: { name: string }) {
  return (
    <section className="relative isolate overflow-hidden gradient-section text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 lg:py-28 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="max-w-2xl">
          <p data-a="fade" className="text-xs font-semibold tracking-[0.22em] uppercase text-sky-200">Gabung bersama kami</p>
          <h2 data-a="blur" data-d="120" className="mt-4 text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight">Mahasiswa asal Cempaka? Rumahmu di perantauan ada di sini.</h2>
          <p className="mt-5 text-white/70 text-lg leading-relaxed">Daftar sebagai anggota {name}, lalu pengurus akan menghubungimu lewat WhatsApp.</p>
        </div>
        <div className="flex flex-wrap gap-4 shrink-0">
          <Link href="/daftar" data-magnetic className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-white pl-8 pr-7 font-bold text-[#0b2a63] hover:bg-sky-100 transition-colors">
            Daftar anggota <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/kontak" data-magnetic className="inline-flex h-14 items-center rounded-full px-7 font-semibold text-white ring-1 ring-white/35 hover:bg-white/10 transition-colors">
            Hubungi pengurus
          </Link>
        </div>
      </div>
    </section>
  );
}
