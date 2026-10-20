import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/ui/Logo";
import CempakaMark from "@/components/ui/CempakaMark";

export const metadata = { title: "Masuk Admin | KMKC" };
export const dynamic = "force-dynamic";

const kemampuan = [
  ["Konten", "Berita, galeri, program kerja, dan agenda"],
  ["Organisasi", "Struktur pengurus, sejarah, dan profil"],
  ["Kotak masuk", "Pesan dan pendaftaran anggota baru"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="min-h-dvh grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white">
      {/* Panel merek */}
      <aside className="relative isolate overflow-hidden bg-[#071a3d] text-white px-6 py-8 sm:px-10 lg:px-14 lg:py-12 flex flex-col">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_0%,#12418f_0%,transparent_60%),radial-gradient(90%_70%_at_100%_100%,#0b5a8f_0%,transparent_65%)]" />
        <CempakaMark className="absolute -z-10 text-sky-200/70 w-[34rem] max-w-none -right-40 -bottom-44 lg:w-[44rem] lg:-right-60 lg:-bottom-72" />

        <Link href="/" className="inline-flex items-center gap-3 w-fit group" aria-label="Kembali ke website KMKC">
          <Logo size={44} priority />
          <span className="leading-tight">
            <span className="block font-extrabold tracking-tight text-lg">KMKC</span>
            <span className="block text-[11px] tracking-[0.18em] uppercase text-sky-200/70">Kecamatan Cempaka</span>
          </span>
        </Link>

        <div className="mt-10 lg:mt-auto lg:mb-auto lg:py-16 max-w-md">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-sky-300">Ruang kerja pengurus</p>
          <h1 className="mt-3 text-3xl sm:text-4xl xl:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight">
            Kelola rumah bersama, dari satu tempat.
          </h1>
          <ul className="hidden sm:block mt-10 divide-y divide-white/10 border-y border-white/10">
            {kemampuan.map(([t, d]) => (
              <li key={t} className="flex gap-6 py-3.5 text-sm">
                <span className="w-24 shrink-0 font-semibold text-white">{t}</span>
                <span className="text-white/60">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden lg:block text-xs text-white/40">© {new Date().getFullYear()} Keluarga Mahasiswa Kecamatan Cempaka</p>
      </aside>

      {/* Panel form */}
      <section className="flex flex-col px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex justify-end">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition-colors">
            <ArrowLeft size={15} /> Ke website
          </Link>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto py-10">
            {isSupabaseConfigured ? (
              <>
                <h2 className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-primary-dark">Masuk</h2>
                <p className="mt-2 text-sm text-neutral-500">Gunakan akun admin yang terdaftar.</p>
                <div className="mt-8">
                  <LoginForm notice={e === "forbidden" ? "Akun ini belum terdaftar sebagai admin." : undefined} />
                </div>
                <p className="mt-8 text-xs leading-relaxed text-neutral-400">
                  Lupa kata sandi? Minta presidium mengatur ulang lewat Supabase → Authentication → Users.
                </p>
              </>
            ) : (
              <div className="text-sm text-neutral-600 space-y-5">
                <div className="flex gap-3 border-l-2 border-amber-400 pl-4 text-amber-800">
                  <Database size={18} className="shrink-0 mt-0.5" />
                  <p><b>Supabase belum terhubung.</b> Website tampil dengan data contoh; hubungkan database agar admin aktif.</p>
                </div>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Buat project di supabase.com, jalankan <code className="bg-surface px-1.5 py-0.5 rounded">supabase/schema.sql</code> di SQL Editor.</li>
                  <li>Buat user di Authentication → Users, daftarkan sebagai admin (SQL ada di akhir schema.sql).</li>
                  <li>Isi <code className="bg-surface px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="bg-surface px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di Vercel, lalu deploy ulang.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
