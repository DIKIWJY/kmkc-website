import Photo from "@/components/ui/Photo";

/**
 * Deretan foto kegiatan berpotongan diagonal (hitam-putih, berwarna saat di-hover) di bawah hero.
 * Tanpa kotak/kartu: hanya potongan foto dengan celah diagonal, seperti referensi.
 */
export default function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length < 3) return null;
  const list = photos.slice(0, 5);

  return (
    <div className="relative z-10 w-full max-w-[1500px] mx-auto px-4 sm:px-8 mt-14 sm:mt-20" aria-hidden>
      <ul data-stagger="110" className="flex justify-center items-stretch">
        {list.map((src, i) => (
          <li
            key={i}
            data-a="up" className="photo-cut group relative h-36 sm:h-48 lg:h-60 shrink-0 overflow-hidden"
          >
            <Photo src={src} alt="" sizes="(max-width: 768px) 34vw, 20vw" className="grayscale group-hover:grayscale-0 md:group-hover:scale-105 transition duration-700" />
            <span className="absolute inset-0 bg-[#0b3a85]/25 group-hover:opacity-0 transition-opacity duration-700" />
          </li>
        ))}
      </ul>
    </div>
  );
}
