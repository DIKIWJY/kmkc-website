import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-accent">Kode 404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-neutral-500">Tautan yang kamu buka mungkin sudah dipindahkan atau dihapus.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-primary-dark px-6 text-sm font-semibold text-white hover:bg-primary transition-colors">Kembali ke beranda</Link>
          <Link href="/kontak" className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-primary ring-1 ring-black/10 hover:bg-black/[0.03] transition-colors">Hubungi kami</Link>
        </div>
      </div>
    </main>
  );
}
