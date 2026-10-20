/**
 * Definisi resource admin — satu sumber kebenaran untuk:
 *  - form & tabel di UI (client)
 *  - whitelist kolom + validasi di Server Actions (server)
 */

export type FieldType = "text" | "textarea" | "markdown" | "select" | "date" | "image" | "toggle" | "number" | "slug" | "url";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  half?: boolean; // setengah lebar di form
  max?: number;
  slugFrom?: string;
  folder?: string; // folder di bucket media
  maxSize?: number; // sisi terpanjang gambar (px) setelah kompres
  toggleLabels?: [string, string]; // teks saklar: [aktif, nonaktif]; bawaan Terbit/Draft
}

export type ColumnType = "text" | "image" | "badge" | "date" | "bool";

export interface Column {
  key: string;
  label: string;
  type?: ColumnType;
  sub?: string; // baris kedua di bawah teks
  boolLabels?: [string, string]; // label untuk tipe bool: [true, false]
  quickToggle?: boolean; // tipe bool: klik langsung di tabel untuk mengubah (tanpa membuka form)
}

export interface Resource {
  key: string;
  table: string;
  title: string; // judul halaman
  singular: string; // "Pengurus"
  description: string;
  fields: Field[];
  columns: Column[];
  labelField: string;
  searchFields: string[];
  order: { col: string; asc: boolean; then?: { col: string; asc: boolean } };
  reorder?: boolean;
  bulkImage?: { field: string; titleField: string };
  defaults: Record<string, string | boolean | number>;
  revalidate: string[];
  imageFields: string[];
}

const statusOptions = [
  { value: "upcoming", label: "Akan datang" },
  { value: "ongoing", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
];

const iconOptions = [
  { value: "briefcase", label: "Tas kerja" },
  { value: "book-open", label: "Buku" },
  { value: "share-2", label: "Berbagi" },
  { value: "trophy", label: "Piala" },
  { value: "users", label: "Orang" },
];

export const ICON_KEYS = iconOptions.map((o) => o.value);

export const RESOURCES: Record<string, Resource> = {
  members: {
    key: "members",
    table: "members",
    title: "Kepengurusan",
    singular: "Pengurus",
    description: "Kelola susunan pengurus. Urutan di sini = urutan tampil di website.",
    fields: [
      { name: "photo_url", label: "Foto", type: "image", folder: "members", maxSize: 800, help: "Rasio persegi paling bagus." },
      { name: "name", label: "Nama lengkap", type: "text", required: true, max: 120 },
      { name: "position", label: "Jabatan", type: "text", required: true, half: true, placeholder: "Ketua Umum", max: 100 },
      { name: "division", label: "Bidang / Divisi", type: "text", required: true, half: true, placeholder: "Presidium", max: 100 },
      { name: "period", label: "Periode", type: "text", half: true, placeholder: "2025/2026", max: 20 },
    ],
    columns: [
      { key: "photo_url", label: "Foto", type: "image" },
      { key: "name", label: "Nama", sub: "position" },
      { key: "division", label: "Bidang", type: "badge" },
      { key: "period", label: "Periode" },
    ],
    labelField: "name",
    searchFields: ["name", "position", "division"],
    order: { col: "order_index", asc: true },
    reorder: true,
    defaults: { period: "2025/2026" },
    revalidate: ["/"],
    imageFields: ["photo_url"],
  },
  programs: {
    key: "programs",
    table: "programs",
    title: "Program Kerja",
    singular: "Program",
    description: "Program kerja organisasi beserta statusnya.",
    fields: [
      { name: "name", label: "Nama program", type: "text", required: true, max: 160 },
      { name: "description", label: "Deskripsi", type: "textarea", max: 600 },
      { name: "division", label: "Bidang penanggung jawab", type: "text", half: true, max: 100 },
      { name: "period", label: "Periode", type: "text", half: true, placeholder: "2025/2026", max: 20 },
      { name: "status", label: "Status", type: "select", options: statusOptions, half: true, required: true },
      { name: "icon", label: "Ikon", type: "select", options: iconOptions, half: true },
      { name: "start_date", label: "Mulai", type: "date", half: true },
      { name: "end_date", label: "Selesai", type: "date", half: true },
    ],
    columns: [
      { key: "name", label: "Program", sub: "division" },
      { key: "status", label: "Status", type: "badge" },
      { key: "start_date", label: "Mulai", type: "date" },
    ],
    labelField: "name",
    searchFields: ["name", "division", "description"],
    order: { col: "created_at", asc: false },
    defaults: { status: "upcoming", icon: "briefcase", period: "2025/2026" },
    revalidate: ["/"],
    imageFields: [],
  },
  gallery: {
    key: "gallery",
    table: "gallery",
    title: "Galeri Kegiatan",
    singular: "Foto",
    description: "Dokumentasi kegiatan. Tip: pakai “Unggah banyak foto”. Foto dengan tanggal kegiatan lebih dari 12 bulan lalu otomatis masuk bagian “Arsip Kegiatan” (statis, per tahun).",
    fields: [
      { name: "image_url", label: "Foto", type: "image", required: true, folder: "gallery", maxSize: 1920 },
      { name: "title", label: "Judul kegiatan", type: "text", required: true, max: 160 },
      { name: "description", label: "Keterangan", type: "textarea", max: 400 },
      { name: "event_date", label: "Tanggal kegiatan", type: "date", half: true },
      {
        name: "category", label: "Kategori", type: "select", half: true, required: true,
        options: [{ value: "Acara", label: "Acara" }, { value: "Kegiatan", label: "Kegiatan" }],
      },
      { name: "visible", label: "Tampil di website", type: "toggle", toggleLabels: ["Tampil di website", "Disembunyikan dari website"], help: "Matikan untuk menyembunyikan foto tanpa menghapusnya — cocok untuk foto yang kurang ramai." },
      { name: "featured", label: "Sorotan", type: "toggle", toggleLabels: ["Sorotan: tampil di putaran utama & strip hero", "Bukan sorotan"], help: "Tandai 3–12 foto kegiatan paling ramai. Foto sorotan tampil di putaran utama galeri; 3–5 teratas juga di strip foto hero." },
    ],
    columns: [
      { key: "image_url", label: "Foto", type: "image" },
      { key: "title", label: "Judul", sub: "description" },
      { key: "category", label: "Kategori", type: "badge" },
      { key: "event_date", label: "Tanggal", type: "date" },
      { key: "visible", label: "Website", type: "bool", boolLabels: ["Tampil", "Disembunyikan"], quickToggle: true },
      { key: "featured", label: "Sorotan", type: "bool", boolLabels: ["Sorotan", "—"], quickToggle: true },
    ],
    labelField: "title",
    searchFields: ["title", "description"],
    order: { col: "event_date", asc: false, then: { col: "created_at", asc: false } },
    bulkImage: { field: "image_url", titleField: "title" },
    defaults: { category: "Acara", visible: true, featured: false },
    revalidate: ["/"],
    imageFields: ["image_url"],
  },
  events: {
    key: "events",
    table: "events",
    title: "Agenda Kegiatan",
    singular: "Agenda",
    description: "Jadwal kegiatan mendatang. Agenda yang sudah lewat otomatis hilang dari website.",
    fields: [
      { name: "cover_image", label: "Gambar / poster (opsional)", type: "image", folder: "events", maxSize: 1600 },
      { name: "title", label: "Nama kegiatan", type: "text", required: true, max: 160 },
      { name: "description", label: "Deskripsi singkat", type: "textarea", max: 500 },
      { name: "event_date", label: "Tanggal", type: "date", required: true, half: true },
      { name: "event_time", label: "Jam", type: "text", half: true, placeholder: "09.00 WIB", max: 40 },
      { name: "location", label: "Lokasi", type: "text", half: true, placeholder: "Aula Kecamatan Cempaka", max: 160 },
      { name: "link", label: "Tautan pendaftaran / info", type: "url", half: true, placeholder: "https://...", max: 300, help: "Opsional. Harus diawali https://" },
    ],
    columns: [
      { key: "cover_image", label: "Poster", type: "image" },
      { key: "title", label: "Kegiatan", sub: "location" },
      { key: "event_date", label: "Tanggal", type: "date" },
      { key: "event_time", label: "Jam" },
    ],
    labelField: "title",
    searchFields: ["title", "location", "description"],
    order: { col: "event_date", asc: false },
    defaults: {},
    revalidate: ["/"],
    imageFields: ["cover_image"],
  },
  articles: {
    key: "articles",
    table: "articles",
    title: "Berita & Artikel",
    singular: "Artikel",
    description: "Tulis berita atau pengumuman. Draft tidak tampil di website sampai dipublikasikan.",
    fields: [
      { name: "cover_image", label: "Gambar sampul", type: "image", folder: "articles", maxSize: 1600 },
      { name: "title", label: "Judul", type: "text", required: true, max: 200 },
      { name: "slug", label: "Slug (alamat URL)", type: "slug", slugFrom: "title", required: true, help: "Otomatis dari judul. Contoh: /berita/slug-ini" },
      { name: "excerpt", label: "Ringkasan", type: "textarea", max: 300, help: "Tampil di kartu berita & hasil pencarian Google." },
      { name: "content", label: "Isi", type: "markdown", max: 20000, help: "Mendukung **tebal**, *miring*, daftar (- item), judul (## Judul), dan [tautan](https://...)" },
      { name: "author", label: "Penulis / Bidang", type: "text", half: true, max: 100 },
      { name: "category", label: "Kategori", type: "text", half: true, placeholder: "Pengumuman", max: 50 },
      { name: "published_at", label: "Tanggal terbit", type: "date", half: true },
      { name: "published", label: "Publikasikan", type: "toggle", half: true, help: "Matikan untuk menyimpan sebagai draft." },
    ],
    columns: [
      { key: "cover_image", label: "Sampul", type: "image" },
      { key: "title", label: "Judul", sub: "author" },
      { key: "published", label: "Status", type: "bool" },
      { key: "published_at", label: "Terbit", type: "date" },
    ],
    labelField: "title",
    searchFields: ["title", "excerpt", "author", "category"],
    order: { col: "created_at", asc: false },
    defaults: { published: false, category: "Pengumuman" },
    revalidate: ["/", "/berita/[slug]", "/sitemap.xml"],
    imageFields: ["cover_image"],
  },
  registrations: {
    key: "registrations",
    table: "registrations",
    title: "Pendaftar Anggota",
    singular: "Pendaftar",
    description: "Pendaftaran dari halaman /daftar. Ubah status saat sudah dihubungi, lalu unduh sebagai CSV bila perlu.",
    fields: [
      { name: "full_name", label: "Nama lengkap", type: "text", required: true, max: 120 },
      { name: "phone", label: "WhatsApp", type: "text", required: true, half: true, max: 24 },
      { name: "email", label: "Email", type: "text", half: true, max: 200 },
      { name: "village", label: "Desa asal", type: "text", half: true, max: 120 },
      { name: "batch", label: "Angkatan", type: "text", half: true, max: 20 },
      { name: "campus", label: "Perguruan tinggi", type: "text", half: true, max: 160 },
      { name: "major", label: "Program studi", type: "text", half: true, max: 160 },
      { name: "message", label: "Pesan pendaftar", type: "textarea", max: 1000 },
      {
        name: "status", label: "Status", type: "select", required: true, half: true,
        options: [{ value: "baru", label: "Baru" }, { value: "dihubungi", label: "Sudah dihubungi" }, { value: "diterima", label: "Diterima" }, { value: "ditolak", label: "Ditolak" }],
      },
      { name: "note", label: "Catatan internal", type: "textarea", max: 1000, help: "Hanya terlihat oleh admin." },
    ],
    columns: [
      { key: "full_name", label: "Nama", sub: "phone" },
      { key: "campus", label: "Kampus", sub: "major" },
      { key: "village", label: "Desa" },
      { key: "status", label: "Status", type: "badge" },
      { key: "created_at", label: "Masuk", type: "date" },
    ],
    labelField: "full_name",
    searchFields: ["full_name", "phone", "campus", "village", "major"],
    order: { col: "created_at", asc: false },
    defaults: { status: "baru" },
    revalidate: [],
    imageFields: [],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);

/** Alamat halaman admin untuk tiap resource (dipakai pencarian global & tautan). */
export const ADMIN_PATH: Record<string, string> = {
  members: "/admin/kepengurusan",
  programs: "/admin/program",
  events: "/admin/agenda",
  gallery: "/admin/gallery",
  articles: "/admin/berita",
  registrations: "/admin/pendaftar",
};
