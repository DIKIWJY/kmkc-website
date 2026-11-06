import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/ui/Logo";
import CempakaMark from "@/components/ui/CempakaMark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata = { title: "Masuk · Admin KMKC" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-2">
      {/* Panel merek — hanya di layar lebar */}
      <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <CempakaMark className="pointer-events-none absolute -bottom-32 -right-32 size-[38rem] text-white" />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <Logo size={44} priority alt="" className="rounded-full ring-2 ring-white/15" />
          <span className="text-lg font-semibold tracking-tight text-white">KMKC</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Kelola website Keluarga Mahasiswa Kecamatan Cempaka.
          </h2>
          <p className="mt-4 leading-relaxed">
            Berita, agenda, galeri, kepengurusan, dan pendaftaran anggota dalam satu panel.
          </p>
        </div>
        <p className="relative text-xs opacity-70">© {new Date().getFullYear()} KMKC. Khusus pengurus.</p>
      </aside>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke website
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <span className="mb-6 inline-flex lg:hidden"><Logo size={48} priority alt="" className="rounded-full" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Masuk ke Admin KMKC</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Gunakan akun admin yang terdaftar.</p>
          </div>

          {isSupabaseConfigured ? (
            <LoginForm notice={e === "forbidden" ? "Akun ini belum terdaftar sebagai admin." : undefined} />
          ) : (
            <div className="space-y-4">
              <Alert>
                <Database />
                <AlertTitle>Supabase belum terhubung</AlertTitle>
                <AlertDescription>Website tampil dengan data contoh; hubungkan database agar admin aktif.</AlertDescription>
              </Alert>
              <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
                <li>Buat project di supabase.com, jalankan <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">supabase/schema.sql</code> di SQL Editor.</li>
                <li>Buat user di Authentication → Users, daftarkan sebagai admin (SQL ada di akhir schema.sql).</li>
                <li>Isi <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di Vercel, lalu deploy ulang.</li>
              </ol>
            </div>
          )}

          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            Lupa kata sandi? Minta presidium mengatur ulang lewat Supabase → Authentication → Users.
          </p>
        </div>
      </section>
    </main>
  );
}
