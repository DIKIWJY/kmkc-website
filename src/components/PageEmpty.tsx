import Link from "next/link";

/** Keadaan kosong untuk halaman yang datanya belum diisi dari admin. */
export default function PageEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-44 pb-32 text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-dark">{title}</h1>
      <p className="mt-4 text-neutral-500 leading-relaxed">{text}</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-primary-dark px-7 text-sm font-semibold text-white hover:bg-primary transition-colors">Kembali ke beranda</Link>
    </div>
  );
}
