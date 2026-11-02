import Link from "next/link";
import { Database } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/ui/Logo";

export const metadata = { title: "Masuk · Admin KMKC" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="ad-login flex min-h-dvh flex-col items-center px-5 py-8">
      <div className="relative flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.14),0_16px_44px_-8px_rgba(56,189,248,0.65)]"><Logo size={68} priority alt="" className="h-[68px] w-[68px] rounded-full" /></span>
          <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">Masuk ke Admin KMKC</h1>
          <p className="mt-2 text-[15px] text-white/60">Gunakan akun admin yang terdaftar.</p>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm notice={e === "forbidden" ? "Akun ini belum terdaftar sebagai admin." : undefined} />
        ) : (
          <div className="ad-card space-y-4 p-5 text-[14px] text-[var(--ad-ink-2)]">
            <div className="flex gap-3 text-[#0b4a8f]">
              <Database size={18} className="mt-0.5 shrink-0" />
              <p><b className="font-semibold">Supabase belum terhubung.</b> Website tampil dengan data contoh; hubungkan database agar admin aktif.</p>
            </div>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Buat project di supabase.com, jalankan <code className="rounded bg-[var(--ad-fill)] px-1.5 py-0.5">supabase/schema.sql</code> di SQL Editor.</li>
              <li>Buat user di Authentication → Users, daftarkan sebagai admin (SQL ada di akhir schema.sql).</li>
              <li>Isi <code className="rounded bg-[var(--ad-fill)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="rounded bg-[var(--ad-fill)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di Vercel, lalu deploy ulang.</li>
            </ol>
          </div>
        )}

        <p className="mt-8 text-center text-[13px] leading-relaxed text-white/45">
          Lupa kata sandi? Minta presidium mengatur ulang lewat Supabase → Authentication → Users.
        </p>
      </div>
      <Link href="/" className="relative text-[13px] text-sky-300 hover:text-white hover:underline">← Kembali ke website</Link>
    </main>
  );
}
