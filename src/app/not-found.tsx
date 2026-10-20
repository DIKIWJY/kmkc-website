import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#061431] text-center px-6">
      <div>
        <p className="text-gradient text-8xl font-extrabold mb-2">404</p>
        <h1 className="text-white text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
        <p className="text-white/50 mb-8">Tautan yang kamu buka mungkin sudah dipindahkan atau dihapus.</p>
        <Link href="/" className="inline-block px-7 py-3 rounded-full bg-brand-gradient text-white font-semibold">Kembali ke beranda</Link>
      </div>
    </main>
  );
}
