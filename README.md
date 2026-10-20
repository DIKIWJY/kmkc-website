# KMKC — Website Keluarga Mahasiswa Kecamatan Cempaka

Website organisasi + **Admin Panel** untuk mengelola semua kontennya tanpa menyentuh kode.

## Tech stack

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** | Halaman publik statis (ISR), admin dinamis, Server Actions |
| Styling | **Tailwind CSS v4**, font Montserrat + Poppins (`@fontsource`), ikon `lucide-react` | Desain, animasi CSS murni (tanpa library animasi) |
| Database | **Supabase** (PostgreSQL) + **Row Level Security** | Menyimpan pengurus, program, agenda, galeri, berita, pesan, pengaturan, log |
| Auth | **Supabase Auth** (`@supabase/ssr`, session di cookie httpOnly) + tabel `admins` | Login admin yang aman |
| File | **Supabase Storage** (bucket `media`) | Foto — dikompres jadi WebP di browser sebelum diunggah |
| Hosting | **Vercel** | Deploy otomatis dari GitHub, CDN global, HTTPS gratis |
| Analitik | **Vercel Web Analytics** | Statistik pengunjung (aktifkan di dashboard Vercel) |

### Alur kerja
```
Pengunjung ──► Vercel CDN ──► halaman statis (ISR, refresh ≤60 dtk / langsung saat admin menyimpan)
Admin ──► /admin (dijaga proxy.ts + cek di server) ──► Server Actions ──► Supabase (RLS) 
Foto: browser admin ──(kompres WebP)──► Supabase Storage ──► URL publik
```

### Keamanan (berlapis)
1. `proxy.ts` mengalihkan semua `/admin/*` ke login bila belum ada session valid.
2. Layout admin & **setiap Server Action** memeriksa ulang: session valid **dan** user ada di tabel `admins`.
3. **RLS di database**: publik hanya boleh *membaca* konten & *mengirim* pesan; hanya admin yang boleh menulis. Walau seseorang punya anon key, dia tidak bisa mengubah data.
4. Storage: hanya admin yang bisa upload/hapus; tipe file & ukuran dibatasi (5 MB, gambar saja).
5. Form kontak: honeypot, jeda minimal, validasi panjang + CHECK constraint di database.
6. Header keamanan (nosniff, X-Frame-Options untuk /admin, dll.) di `next.config.ts`.

## Fitur website publik
- **Logo**: `public/logo.png` (lingkaran transparan) dipakai apa adanya, tanpa kotak, di navbar, hero, footer (versi hitam-putih, berwarna saat di-hover), login/sidebar admin, favicon, dan gambar pratinjau link. Untuk mengganti logo, timpa `public/logo.png`, `public/icon-192.png`, `public/icon-512.png`, `src/app/icon.png`, `src/app/apple-icon.png`, dan `src/app/_assets/logo-og.png`.
- **Hero**: tipografi "KMKC" raksasa (naik huruf per huruf) dengan ornamen garis bunga cempaka sebagai latar (logo hanya di navbar, tidak diulang), baris agenda berikutnya, angka ringkas dipisah garis tipis (diatur di Admin → Pengaturan), dan (opsional) deretan foto berpotongan diagonal (hitam-putih, berwarna saat di-hover). Strip ini opsional: muncul hanya bila minimal 3 foto ditandai **Sorotan** di Admin → Galeri (maks. 5 tampil). Tanpa itu, hero tampil bersih tanpa foto.
- **Hero, Siapa Kami, Visi & Misi, Kepengurusan, Program Kerja, Galeri (coverflow + filter + lightbox), Berita, Kontak** dengan animasi CSS murni.
- **History of KMKC**: kartu pembuka dengan tahun besar, linimasa perjalanan bergaya zig-zag (garis tergambar mengikuti scroll), dan kartu para penggagas. Semua isinya dari Admin → Pengaturan.
- **Daftar anggota online (`/daftar`)**: formulir pendaftaran dengan honeypot, batas waktu minimal isi, dan validasi; masuk ke Admin → Pendaftar. Tombol **Gabung** di navbar dan tombol **WhatsApp melayang** (muncul bila nomor WA diisi di Pengaturan).
- **Galeri + Arsip Kegiatan**: kamu yang menentukan foto mana yang tampil — tiap foto punya saklar **Tampil di website** (matikan untuk menyembunyikan foto yang kurang ramai tanpa menghapusnya) dan **Sorotan** (foto terbaik; bila ≥3 ditandai, hanya itu yang diputar di coverflow utama dan 3–5 teratasnya jadi strip hero). Kedua saklar bisa diklik langsung di tabel admin. Selain itu, kegiatan ≤12 bulan terakhir tampil di coverflow + grid; yang lebih lama otomatis pindah ke bagian **Arsip Kegiatan** — statis (tanpa animasi/JS), dikelompokkan per tahun, 8 foto per tahun dengan sisanya terlipat. Admin cukup mengisi *tanggal kegiatan* saat mengunggah foto; tidak ada pengaturan tambahan.
- **Agenda Kegiatan**: acara terdekat dengan hitung mundur langsung (WIB), daftar acara berikutnya, tombol *Tambah ke Google Calendar*. Agenda yang sudah lewat otomatis hilang.
- **/berita**: semua berita dengan pencarian + filter kategori; halaman artikel punya waktu baca, tombol bagikan (WhatsApp/salin/share HP), dan "Baca juga".
- **SEO & distribusi**: gambar pratinjau otomatis saat tautan dibagikan (`/opengraph-image`), `sitemap.xml`, `robots.txt`, RSS `/feed.xml`, data terstruktur JSON-LD (Organization & NewsArticle), manifest PWA.
- **Aksesibilitas**: tautan "Lompat ke konten", fokus keyboard terlihat, hormati `prefers-reduced-motion`, bar progres baca (CSS murni).

## Fitur Admin Panel (`/admin`)
- **Dashboard analitik**: grafik area tampilan & pengunjung (7/30/90 hari, tooltip, % perubahan), donat perangkat, sumber kunjungan (Instagram/WhatsApp/Google/…), halaman terpopuler, kartu KPI + sparkline, grafik pesan 14 hari, checklist kelengkapan, pendaftar & aktivitas terbaru. Data dari pencacah sendiri (`/api/track`): **tanpa cookie pelacak, tanpa IP**, hanya agregat harian, bot disaring, menghormati Do Not Track, `/admin` tidak dihitung.
- **Pendaftar**: status (baru/dihubungi/diterima/ditolak), catatan internal, **unduh CSV** (aman dari CSV-injection).
- **Kepengurusan**: tambah/edit/hapus, foto, **atur urutan** (naik/turun).
- **Program Kerja**: status (akan datang/berjalan/selesai), ikon, tanggal.
- **Agenda**: tanggal, jam, lokasi, poster, tautan pendaftaran (wajib https).
- **Galeri**: tambah satu per satu atau **unggah banyak foto sekaligus**; kategori Acara/Kegiatan.
- **Berita**: editor Markdown + pratinjau, slug otomatis, **draft/terbit**, halaman detail `/berita/[slug]` + SEO.
- **Pesan Masuk**: inbox, belum dibaca, cari, balas via email, hapus, **ekspor CSV**.
- **Pengaturan**: nama, tagline, tentang, foto, **History of KMKC (pembuka, linimasa yang bisa diurutkan, pendiri + peran)**, visi/misi, angka ringkas, kontak & sosial media (WA, IG, TikTok, YouTube). Juga tombol **Unduh cadangan** (seluruh data jadi satu berkas JSON).
- **Pencarian cepat (Ctrl/⌘ + K)**: lompat ke halaman mana pun atau cari pengurus, program, agenda, berita, foto, dan pesan sekaligus.
- **Log Aktivitas**: siapa mengubah apa & kapan.
- Pencarian + paginasi di semua tabel, konfirmasi hapus, notifikasi, responsif di HP.

## Setup (sekali saja)

### 1. Supabase
1. Buat project di <https://supabase.com> (region **Singapore** paling dekat).
2. **SQL Editor** → tempel isi `supabase/schema.sql` → **Run**.
   *(Opsional)* jalankan `supabase/seed.sql` untuk contoh konten.
   *(Sudah pernah menjalankan versi lama?)* Aman dijalankan ulang — skema bersifat idempoten dan hanya menambah tabel `events` serta kolom `timeline`.
3. **Authentication → Users → Add user** → isi email & password admin (centang *Auto Confirm*).
4. Di SQL Editor, daftarkan user itu sebagai admin:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'EMAIL_ADMIN_KAMU';
   ```
5. **Authentication → Sign In / Providers → Email**: matikan *Allow new users to sign up* (agar orang asing tidak bisa mendaftar).
6. **Project Settings → API**: salin **Project URL** dan **anon/publishable key**.

### 2. Lokal (opsional)
```bash
cp .env.local.example .env.local   # isi URL & key
npm install
npm run dev                         # http://localhost:3000
```
Tanpa `.env.local`, website tampil dengan data contoh dan `/admin/login` menampilkan panduan setup.

### 3. Deploy ke Vercel
1. Push project ke GitHub.
2. <https://vercel.com/new> → import repo (framework terdeteksi otomatis: Next.js).
3. **Environment Variables** (Production & Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → alamat final, mis. `https://kmkc.vercel.app`
4. **Deploy**. Selesai — buka `/admin` dan login.
5. *(Opsional)* Domain sendiri: **Settings → Domains**. Analitik: tab **Analytics → Enable**.

> Setiap `git push` ke `main` otomatis deploy ulang. Konten yang diubah lewat admin **tidak** perlu deploy — langsung tampil.

## Performa & responsivitas
- Halaman publik statis (ISR 60 dtk) — tidak ada query database saat dikunjungi; JS ±166 KB di beranda.
- Foto dari Supabase otomatis dioptimasi Vercel (AVIF/WebP, ukuran sesuai layar) lewat `src/components/ui/Photo.tsx`; di lokal/non-Supabase otomatis memakai `<img>` biasa.
- Animasi berat dimatikan di HP, autoplay galeri berhenti saat tidak terlihat, `prefers-reduced-motion` dihormati.
- Diuji di lebar 320/375/768/1024/1440 px (halaman publik + seluruh halaman admin): tanpa scroll horizontal.

## Upgrade dari versi lama
Jalankan ulang seluruh `supabase/schema.sql` di SQL Editor (aman diulang; tidak menghapus data). Ini menambah kolom `gallery.featured` dan `gallery.visible`, tabel `registrations` & `daily_stats`, fungsi `track_view` dan `admin_stats`.

## Struktur kode
```
supabase/schema.sql         skema + RLS + storage (jalankan sekali)
src/proxy.ts                penjaga /admin (Next 16: pengganti middleware)
src/lib/supabase/           client publik / server / browser / session
src/lib/data.ts             pengambilan data publik (+ fallback data contoh)
src/lib/admin/schema.ts     definisi resource admin (form, kolom, validasi)
src/lib/admin/actions.ts    Server Actions (simpan, hapus, urut, pengaturan, login)
src/app/(halaman publik)    page.tsx, berita, berita/[slug], feed.xml, opengraph-image, manifest, sitemap, robots
src/components/            komponen publik (History, Agenda, Countdown, Gallery, ...)
src/lib/date.ts             utilitas tanggal WIB, hitung hari, tautan Google Calendar
src/app/admin/              login + (panel): dashboard, CRUD, pendaftar (+CSV), pesan, pengaturan, log; backup/ (unduh JSON)
src/app/api/track           pencacah kunjungan (tanpa cookie) → RPC track_view
src/app/daftar              formulir pendaftaran anggota
src/components/admin/charts grafik SVG ringan (area, donat, batang, sparkline)
```
Menambah jenis konten baru (mis. "Alumni") cukup: tabel baru di SQL + satu entri di `RESOURCES` + satu file `page.tsx` tipis.
