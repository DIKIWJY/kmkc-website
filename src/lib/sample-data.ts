import type { Member, Division, GalleryItem, Article, Program, SiteSettings, EventItem } from "./types";
import { addDays, todayWIB } from "./date";

/* Data contoh — hanya tampil bila Supabase belum dikonfigurasi (mode pratinjau). */

export const sampleSettings: SiteSettings = {
  name: "KMKC",
  full_name: "Keluarga Mahasiswa Kecamatan Cempaka",
  tagline: "Rumah bersama mahasiswa Cempaka di perantauan — saling menguatkan, tumbuh, dan berbagi untuk daerah.",
  about:
    "**KMKC** adalah wadah **silaturahmi** dan **kekeluargaan** bagi mahasiswa asal Kecamatan Cempaka dari **13 desa** dan beragam perguruan tinggi. Berdiri sejak **2008**, kami tumbuh menjadi rumah bersama bagi mahasiswa Cempaka di perantauan.\n\nKami percaya setiap anggota punya potensi. Lewat **pengembangan diri**, **kegiatan sosial**, dan **kolaborasi**, kami ingin setiap mahasiswa Cempaka tumbuh dan memberi **dampak nyata** bagi daerah asalnya.",
  vision: "Menjadi keluarga mahasiswa yang **solid**, **berprestasi**, dan **berkontribusi nyata** bagi kemajuan Kecamatan Cempaka.",
  mission: [
    "Mempererat tali silaturahmi dan kekeluargaan antar mahasiswa Cempaka",
    "Mendorong prestasi akademik dan pengembangan diri anggota",
    "Menjadi jembatan informasi antara mahasiswa dan masyarakat Cempaka",
    "Menyelenggarakan kegiatan sosial dan pengabdian untuk daerah",
    "Membangun jejaring dengan alumni, kampus, dan mitra",
    "Menjaga organisasi yang transparan, inklusif, dan profesional",
  ],
  stats: [
    { value: "2008", label: "Tahun berdiri" },
    { value: "13", label: "Desa" },
    { value: "8", label: "Penggagas" },
  ],
  email: "kmkcjayajaya@gmail.com",
  phone: "",
  address: "TPA Sija Carana",
  instagram: "https://www.instagram.com/kmkc.id",
  tiktok: "https://www.tiktok.com/@kmkc_18",
  youtube: "",
  whatsapp: "https://wa.me/qr/VPQNDHKWIN6VC1",
  about_photo: "",
  registration_open: true,
  registration_mode: "builtin",
  gform_url: "",
  registration_note: "",
  registration_fee: 0,
  payment_info: "",
  payment_qr: "",
  history:
    "**KMKC** dilahirkan pada **Musyawarah Besar perdana** tanggal **27 Januari 2008** di Taman Bacaan Masyarakat Desa Cempaka, dihadiri tidak kurang dari **50 mahasiswa** dari **13 desa** di Kecamatan Cempaka. Berawal dari obrolan ringan para mahasiswa di perantauan, lahirlah rumah bersama yang terus tumbuh hingga hari ini.",
  founders: [
    { name: "Ardiansyah", campus: "FKIP Unsri" },
    { name: "Rafelta Tuska Putra", campus: "FP Unsri", role: "Ketua Umum pertama" },
    { name: "Agus Sai", campus: "FT Unsri" },
    { name: "Herianto", campus: "FT Unsri" },
    { name: "Beni Wirayudha", campus: "FP Unsri" },
    { name: "Novaria Pajrini", campus: "FH Unsri" },
    { name: "Putri Eka Sevtiyuni", campus: "Fasilkom Unsri" },
    { name: "Lisa Selpiyani", campus: "FE Unsri" },
  ],
  timeline: [
    { date: "Sebelum Januari 2008", title: "Gagasan lahir dari obrolan reuni", desc: "Bincang-bincang ringan di beberapa reuni mahasiswa Cempaka memunculkan keinginan untuk punya wadah bersama di perantauan." },
    { date: "20 Januari 2008", title: "Pertemuan persiapan pembentukan", desc: "Digelar pertemuan persiapan pembentukan **Himpunan Mahasiswa Cempaka** (nama awal) di rumah kos seorang kawan. Di sinilah disepakati nama **Keluarga Mahasiswa Kecamatan Cempaka (KMKC)**." },
    { date: "20 – 27 Januari 2008", title: "Delapan penggagas merumuskan ide", desc: "Delapan mahasiswa memformulasikan gagasan tersebut hingga disepakati Musyawarah Besar seminggu setelahnya." },
    { date: "27 Januari 2008", title: "Musyawarah Besar perdana", desc: "Bertempat di Taman Bacaan Masyarakat Desa Cempaka, dihadiri tidak kurang dari **50 mahasiswa** dari **13 desa** di Kecamatan Cempaka." },
    { date: "27 Januari 2008", title: "AD/ART disahkan, Ketua Umum pertama terpilih", desc: "Forum merumuskan **AD/ART** organisasi dan memilih **Rafelta Tuska Putra** sebagai Ketua Umum pertama KMKC." },
  ],
};

const m = (i: number, name: string, position: string, division: string): Member => ({
  id: String(i), name, position, division, photo_url: "", period: "2025/2026", order_index: i, created_at: "",
});

export const sampleDivisions: Division[] = ["Presidium", "Departemen Pendidikan", "Departemen PKMB", "Departemen Humas", "Departemen Medinfo", "Departemen Kewirausahaan", "Departemen Kesehatan"].map((name, i) => ({
  id: `d${i}`, period: "2025/2026", name, description: "", order_index: i + 1,
}));

export const sampleMembers: Member[] = [
  m(1, "Nama Ketua Umum", "Ketua Umum", "Presidium"),
  m(2, "Nama Wakil Ketua 1", "Wakil Ketua Umum 1", "Presidium"),
  m(3, "Nama Wakil Ketua 2", "Wakil Ketua Umum 2", "Presidium"),
  m(4, "Nama Sekretaris 1", "Sekretaris Umum 1", "Presidium"),
  m(5, "Nama Sekretaris 2", "Sekretaris Umum 2", "Presidium"),
  m(6, "Nama Bendahara", "Bendahara Umum", "Presidium"),
  m(7, "Nama Ketua Departemen", "Ketua Departemen Pendidikan", "Departemen Pendidikan"),
  m(8, "Nama Ketua Departemen", "Ketua Departemen PKMB", "Departemen PKMB"),
  m(9, "Nama Ketua Departemen", "Ketua Departemen Humas", "Departemen Humas"),
  m(10, "Nama Ketua Departemen", "Ketua Departemen Medinfo", "Departemen Medinfo"),
  m(11, "Nama Ketua Departemen", "Ketua Departemen Kewirausahaan", "Departemen Kewirausahaan"),
  m(12, "Nama Ketua Departemen", "Ketua Departemen Kesehatan", "Departemen Kesehatan"),
];

const p = (i: number, name: string, description: string, icon: string, division: string, status: Program["status"]): Program => ({
  id: String(i), name, description, icon, division, period: "2025/2026", status, start_date: null, end_date: null, created_at: "",
});

export const samplePrograms: Program[] = [
  p(1, "Penyambutan Mahasiswa Baru", "Menyambut mahasiswa baru asal Cempaka: pengenalan keluarga, pendampingan awal kuliah, dan info kampus.", "users", "Hubungan Daerah & Alumni", "ongoing"),
  p(2, "Bakti Sosial Cempaka", "Kegiatan sosial dan pengabdian langsung bagi masyarakat di Kecamatan Cempaka.", "share-2", "Sosial & Pengabdian", "upcoming"),
  p(3, "Kelas Belajar Bersama", "Sesi belajar, berbagi tips kuliah, dan persiapan beasiswa antar anggota.", "book-open", "Pendidikan & Pengembangan Diri", "ongoing"),
  p(4, "Malam Keakraban", "Acara tahunan untuk mempererat kebersamaan seluruh anggota KMKC.", "trophy", "Presidium", "upcoming"),
];

const g = (i: number, title: string, description: string, date: string, category: GalleryItem["category"]): GalleryItem => ({
  id: String(i), title, description, image_url: "", event_date: date, category, created_at: "",
});

export const sampleGallery: GalleryItem[] = [
  g(1, "Musyawarah Anggota KMKC", "Musyawarah tahunan untuk menetapkan arah dan program kerja.", "2026-09-20", "Acara"),
  g(2, "Malam Keakraban Anggota", "Kebersamaan seluruh anggota dalam satu malam penuh cerita.", "2026-08-15", "Acara"),
  g(3, "Bakti Sosial di Cempaka", "Kegiatan pengabdian bersama warga dan karang taruna.", "2026-07-22", "Kegiatan"),
  g(4, "Seminar Beasiswa & Karier", "Berbagi pengalaman beasiswa bersama alumni.", "2026-06-10", "Acara"),
  g(5, "Kunjungan ke Sekolah Asal", "Memotivasi adik-adik SMA untuk melanjutkan kuliah.", "2026-05-05", "Kegiatan"),
  g(6, "Pelantikan Pengurus", "Pelantikan pengurus baru periode 2025/2026.", "2026-02-08", "Acara"),
  g(7, "Penyambutan Mahasiswa Baru", "Menyambut keluarga baru KMKC di perantauan.", "2026-09-01", "Kegiatan"),
  g(8, "Turnamen Persahabatan", "Pertandingan olahraga antar angkatan.", "2026-08-16", "Kegiatan"),
  g(9, "Gotong Royong Lingkungan", "Bersih-bersih lingkungan bersama warga.", "2026-07-28", "Kegiatan"),
  g(10, "Talkshow Alumni", "Diskusi bersama alumni tentang dunia kerja.", "2026-06-12", "Acara"),
  g(11, "Belajar Bersama", "Sesi belajar kelompok menjelang ujian.", "2026-05-09", "Kegiatan"),
  g(12, "Buka Puasa Bersama", "Tradisi kebersamaan setiap Ramadan.", "2026-03-01", "Acara"),
];

export const sampleArticles: Article[] = [
  {
    id: "1", title: "Selamat Datang di Website KMKC", slug: "selamat-datang-di-website-kmkc",
    excerpt: "Website resmi Keluarga Mahasiswa Kecamatan Cempaka kini hadir sebagai pusat informasi kegiatan dan kabar terbaru.",
    content: "Website resmi **KMKC** kini hadir.\n\nDi sini kamu bisa mengikuti kabar terbaru, melihat dokumentasi kegiatan, mengenal pengurus, dan menghubungi kami.\n\n- Informasi kegiatan\n- Dokumentasi acara\n- Kontak pengurus",
    cover_image: "", author: "Media & Kreatif", category: "Pengumuman", published: true, published_at: "2026-10-01", created_at: "",
  },
  {
    id: "2", title: "Pendaftaran Anggota Baru Dibuka", slug: "pendaftaran-anggota-baru",
    excerpt: "Mahasiswa asal Cempaka yang baru masuk kuliah, yuk gabung jadi bagian keluarga besar KMKC.",
    content: "Pendaftaran anggota baru KMKC resmi dibuka untuk seluruh mahasiswa asal Kecamatan Cempaka.\n\nHubungi pengurus melalui halaman kontak untuk informasi lebih lanjut.",
    cover_image: "", author: "Presidium", category: "Pengumuman", published: true, published_at: "2026-09-20", created_at: "",
  },
  {
    id: "3", title: "Refleksi Kegiatan Bakti Sosial", slug: "refleksi-bakti-sosial",
    excerpt: "Cerita dan dokumentasi dari kegiatan pengabdian KMKC bersama masyarakat.",
    content: "Kegiatan bakti sosial berlangsung meriah dengan partisipasi puluhan anggota.\n\nTerima kasih untuk semua yang terlibat.",
    cover_image: "", author: "Sosial & Pengabdian", category: "Liputan", published: true, published_at: "2026-08-05", created_at: "",
  },
];

/** Agenda contoh (tanggal relatif terhadap hari ini supaya selalu tampil sebagai agenda mendatang). */
export function sampleEvents(): EventItem[] {
  const t = todayWIB();
  const e = (i: number, offset: number, title: string, description: string, time: string, location: string): EventItem => ({
    id: `ev${i}`, title, description, location, event_date: addDays(t, offset), event_time: time, cover_image: "", link: "", created_at: "",
  });
  return [
    e(1, 9, "Musyawarah Anggota KMKC", "Evaluasi program kerja dan penetapan arah organisasi bersama seluruh anggota.", "09.00 WIB", "Aula Kecamatan Cempaka"),
    e(2, 23, "Bakti Sosial & Gotong Royong", "Aksi bersih lingkungan dan bakti sosial bersama warga dan karang taruna.", "07.30 WIB", "Desa Cempaka"),
    e(3, 41, "Seminar Beasiswa & Karier", "Berbagi pengalaman meraih beasiswa dan membangun karier bersama alumni KMKC.", "13.00 WIB", "Online via Zoom"),
    e(4, 66, "Malam Keakraban KMKC", "Malam kebersamaan seluruh keluarga besar KMKC.", "19.00 WIB", "Taman Bacaan Masyarakat"),
  ];
}

/** Agenda contoh yang sudah lewat (untuk daftar "Telah berlalu" di /agenda). */
export function samplePastEvents(): EventItem[] {
  const t = todayWIB();
  const e = (i: number, offset: number, title: string, description: string, time: string, location: string): EventItem => ({
    id: `pv${i}`, title, description, location, event_date: addDays(t, offset), event_time: time, cover_image: "", link: "", created_at: "",
  });
  return [
    e(1, -21, "Penyambutan Mahasiswa Baru", "Menyambut keluarga baru KMKC di perantauan.", "09.00 WIB", "Aula Kecamatan Cempaka"),
    e(2, -48, "Turnamen Persahabatan Antar Angkatan", "Pertandingan olahraga untuk mempererat kebersamaan.", "08.00 WIB", "Lapangan Desa Cempaka"),
    e(3, -75, "Talkshow Alumni", "Diskusi dunia kerja bersama alumni KMKC.", "13.00 WIB", "Online via Zoom"),
    e(4, -110, "Pelantikan Pengurus", "Pelantikan pengurus baru periode berjalan.", "10.00 WIB", "Taman Bacaan Masyarakat"),
  ];
}
