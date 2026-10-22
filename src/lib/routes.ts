/** Satu sumber kebenaran untuk seluruh rute publik (navbar, footer, sitemap). */
export interface NavItem {
  href: string;
  label: string;
  /** Deskripsi singkat untuk metadata halaman */
  desc?: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/tentang", label: "Tentang", desc: "Profil, sejarah, visi dan misi KMKC." },
  { href: "/kepengurusan", label: "Kepengurusan", desc: "Struktur pengurus KMKC." },
  { href: "/program-kerja", label: "Program Kerja", desc: "Program kerja dan kegiatan KMKC." },
  { href: "/agenda", label: "Agenda", desc: "Jadwal kegiatan KMKC yang akan datang." },
  { href: "/galeri", label: "Galeri", desc: "Dokumentasi foto kegiatan KMKC." },
  { href: "/berita", label: "Berita", desc: "Berita, pengumuman, dan cerita kegiatan KMKC." },
  { href: "/kontak", label: "Kontak", desc: "Hubungi pengurus KMKC." },
];

/** Tampil di menu seluler dan footer, tetapi tidak di bilah utama. */
export const MORE_NAV: NavItem[] = [
  { href: "/", label: "Beranda" },
  { href: "/daftar", label: "Daftar Anggota" },
];

/** Alamat masuk admin. Beberapa alias dialihkan ke sini (lihat next.config.ts). */
export const ADMIN_LOGIN = "/admin/login";
