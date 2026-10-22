# KMKC — Website Keluarga Mahasiswa Kecamatan Cempaka

Website organisasi + **Admin Panel** untuk mengelola semua kontennya tanpa menyentuh kode.

## Tech stack

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** | Halaman publik statis (ISR), admin dinamis, Server Actions |
| Styling | **Tailwind CSS v4**, font Montserrat (judul) + Poppins (teks), ikon `lucide-react` | Desain; animasi memakai mesin kecil buatan sendiri (`src/components/Motion.tsx`, tanpa library) |
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
- **Logo**: `public/logo.png` (lingkaran transparan) dipakai apa adanya, tanpa kotak, di navbar, footer, login/sidebar admin, favicon, dan gambar pratinjau link. Untuk mengganti logo, timpa `public/logo.png`, `public/icon-192.png`, `public/icon-512.png`, `src/app/icon.png`, `src/app/apple-icon.png`, dan `src/app/_assets/logo-og.png`.
- **Tampilan (v9, gelap-biru + animasi kaya)**: hero gelap dengan judul "KMKC" raksasa (naik per huruf, berkilau pelan, membesar saat disentuh kursor), garis bunga cempaka yang tergambar sendiri, titik cahaya naik, parallax mengikuti kursor dan scroll, angka statistik menghitung naik, lalu pita teks raksasa yang berjalan dan miring mengikuti kecepatan scroll. Di bawahnya: judul bagian naik per kata, foto terbuka dengan *clip*, kalimat Visi terisi kata demi kata saat digulir, kartu miring 3D dengan kilau mengikuti kursor, garis timeline tergambar, tombol "magnet", cincin kursor berlabel (Lihat/Daftar), navbar yang bersembunyi saat scroll turun dan muncul saat naik, progres baca di tepi atas, transisi antarhalaman, dan tirai pembuka KMKC (hanya kunjungan pertama ke beranda dalam satu sesi).
- **Siapa Kami, Visi & Misi, Kepengurusan, Program Kerja, Galeri (baris geser + filter + lightbox), Berita, Kontak** dengan animasi masuk-layar.
- **History of KMKC**: kartu pembuka dengan tahun besar, linimasa perjalanan bergaya zig-zag (garis tergambar mengikuti scroll), dan kartu para penggagas. Semua isinya dari Admin → Pengaturan.
- **Daftar anggota online (`/daftar`)**: formulir pendaftaran dengan honeypot, batas waktu minimal isi, dan validasi; masuk ke Admin → Pendaftar. Tombol **Gabung** di navbar dan tombol **WhatsApp melayang** (muncul bila nomor WA diisi di Pengaturan).
- **Galeri + Arsip Kegiatan**: kamu yang menentukan foto mana yang tampil — tiap foto punya saklar **Tampil di website** (matikan untuk menyembunyikan foto yang kurang ramai tanpa menghapusnya) dan **Sorotan** (foto terbaik; bila ≥3 ditandai, hanya itu yang tampil di baris geser galeri dan 3–5 teratasnya jadi panggung foto hero). Kedua saklar bisa diklik langsung di tabel admin. Selain itu, kegiatan ≤12 bulan terakhir tampil di baris geser (beranda) dan susunan foto penuh (halaman Galeri); yang lebih lama otomatis pindah ke bagian **Arsip Kegiatan** — statis (tanpa animasi/JS), dikelompokkan per tahun, 8 foto per tahun dengan sisanya terlipat. Admin cukup mengisi *tanggal kegiatan* saat mengunggah foto; tidak ada pengaturan tambahan.
- **Agenda Kegiatan**: acara terdekat dengan hitung mundur langsung (WIB), daftar acara berikutnya, tombol *Tambah ke Google Calendar*. Agenda yang sudah lewat otomatis hilang.
- **/berita**: semua berita dengan pencarian + filter kategori; halaman artikel punya waktu baca, tombol bagikan (WhatsApp/salin/share HP), dan "Baca juga".
- **SEO & distribusi**: gambar pratinjau otomatis saat tautan dibagikan (`/opengraph-image`), `sitemap.xml`, `robots.txt`, RSS `/feed.xml`, data terstruktur JSON-LD (Organization & NewsArticle), manifest PWA.
- **Aksesibilitas**: tautan "Lompat ke konten", fokus keyboard terlihat, hormati `prefers-reduced-motion`, bar progres baca (CSS murni).

## Rute website
Semua halaman punya alamat sendiri (tanpa `#`): `/`, `/tentang`, `/kepengurusan`, `/program-kerja`, `/agenda`, `/galeri`, `/berita`, `/kontak`, `/daftar`. Navbar dan footer dipakai bersama lewat `src/app/(site)/layout.tsx`; daftar menu ada di satu tempat: `src/lib/routes.ts`.

**Jalan pintas login admin** (semua diarahkan ke `/admin/login`): `/login`, `/masuk`, `/admin-login`. Alamat lama seperti `/#kontak` tetap membuka beranda; alias lain diatur di `next.config.ts`.

## Pendaftaran anggota (`/daftar`)
- **Formulir bawaan**: semua isian wajib, termasuk **alasan bergabung** (min. 20 karakter) dan **bukti follow Instagram** (tangkapan layar). Gambar dikecilkan di browser (±100–250 KB) lalu masuk ke bucket **privat** `bukti`: pengunjung hanya bisa mengunggah, tidak bisa melihat; hanya admin yang bisa membukanya (lewat `/admin/bukti/…`).
- **Kepengurusan per periode (v11)**: Admin → Kepengurusan. Setiap **periode** (mis. 2025/2026) punya susunannya sendiri: tambah/ubah/hapus/urutkan **bidang atau departemen** sesuka hati, lalu isi tiap bidang dengan pengurus berjabatan bebas (Ketua Umum, Wakil Ketua Umum 1 & 2, Sekretaris Umum 1 & 2, Bendahara Umum, Ketua Departemen …, atau jabatan lain). Periode baru bisa dimulai dari **susunan KMKC** (Presidium + Departemen Pendidikan, PKMB, Humas, Medinfo, Kewirausahaan, Kesehatan), **disalin dari periode lain** (bidang saja, pengurus dikosongkan), atau kosong. Satu periode ditandai **aktif** dan itulah yang tampil di website; periode lama tetap bisa dibuka pengunjung sebagai arsip. Di /kepengurusan pengunjung memilih periode, lalu bidang; tiap bidang dibagi halaman (12 per halaman) dan tautannya bisa dibagikan (`?periode=…&bidang=…`). Mengubah nama bidang/periode otomatis diikuti pengurusnya; menghapus bidang/periode ikut menghapus pengurus (dan foto) di dalamnya, dengan konfirmasi. Tabel baru: `periods` dan `divisions`; data pengurus lama dipindahkan otomatis oleh `schema.sql`.
- **Urutan & waktu relatif (v11)**: setiap daftar di admin (pendaftar, berita, galeri, dst.) punya menu Urutkan — Terbaru, Terlama, Nama A–Z/Z–A — dan judul kolom Nama/tanggal bisa diklik untuk mengurutkan. Kolom "Masuk" pada pendaftar, Pesan Masuk, dan Log Aktivitas menampilkan waktu relatif ("1 menit lalu", "2 jam lalu", "3 hari lalu"; lewat seminggu jadi tanggal) yang diperbarui otomatis; tanggal lengkap muncul saat kursor diarahkan. Tombol naik/turun (Kepengurusan, Program) hanya aktif di "Urutan tampil".
- **Tipografi (v11)**: situs publik memakai satu keluarga huruf, Plus Jakarta Sans (variabel, dimuat sekali, menggantikan Montserrat + Poppins). Admin memakai SF Pro di perangkat Apple dan Inter (dengan sumbu optical size) di perangkat lain.
- **HTM (biaya pendaftaran) + bukti bayar**: isi nominal di Pengaturan → Pendaftaran anggota (kosong/0 = tanpa HTM), lengkap dengan petunjuk rekening/e-wallet dan gambar QRIS. Bila HTM > 0, formulir menampilkan nominal + tujuan pembayaran dan **mewajibkan unggah bukti transfer** (bucket privat `bukti` yang sama). Nominal dibaca server dari database, dan aturan RLS menolak pendaftaran tanpa bukti bila HTM berlaku. Di menu Pendaftar, admin cukup membuka bukti bayar bila perlu (tanpa alur status verifikasi — sengaja disederhanakan). Nominal saat mendaftar tersimpan per pendaftar (`fee_amount`), jadi tidak berubah bila HTM diganti kemudian. CSV dan laporan PDF pendaftar ikut menampilkan nominal HTM serta total yang masuk.
- **Google Form**: di Pengaturan → Pendaftaran anggota, pilih mode Google Form dan tempel tautannya. Hanya tautan `docs.google.com/forms/…` atau `forms.gle/…` yang diterima. Tautan `…/viewform` otomatis ditanam di halaman.
- **Buka/tutup**: saklar di Pengaturan. Saat ditutup, /daftar menampilkan pemberitahuan (dan catatan yang kamu tulis) tanpa formulir.

## Halaman bernomor (pagination)
Daftar panjang dibagi per halaman dengan nomor `1 2 3 …` (ponsel: `‹ 2 / 5 ›`), alamatnya bisa dibagikan (`/berita?hal=2`) dan HTML awal tetap halaman 1 (halaman publik tetap statis/ISR, cepat):

| Halaman | Per halaman |
|---|---|
| Berita | 8 (kartu utama hanya di halaman 1) |
| Galeri (kisi foto) / Arsip per tahun | 12 foto / 3 tahun |
| Kepengurusan | 12 |
| Program kerja | 6 |
| Agenda mendatang / "Telah berlalu" | 4 / 6 |
| Tabel admin, Pesan, Log aktivitas | 12 / 20 / 15 |

Komponen: `src/components/ui/Pagination.tsx` (nomor halaman + hook `usePaged`) dan `Paged.tsx` (pembungkus daftar dari server component). Mengubah jumlah per halaman cukup mengganti konstanta `PER_PAGE`/`PAGE` di tiap komponen.

## Arsip & cadangan (`/admin/arsip`)
- **Pemakaian penyimpanan** (database dan storage) dibaca langsung dari Supabase, dibandingkan dengan batas paket gratis (500 MB / 1 GB).
- **Laporan PDF**: pilih bagian (profil, pengurus, program, agenda, berita, galeri, pendaftar, pesan, statistik), periode, dan opsi (gambar bukti follow, isi lengkap berita, foto galeri). Laporan A4 bersampul dengan daftar isi dan nomor halaman terbuka di tab baru; pilih **Simpan sebagai PDF** di dialog cetak browser.
- **Laporan pendaftar** (`/admin/pendaftar/laporan`, juga lewat tombol *Laporan PDF* di halaman Pendaftar): laporan khusus pendaftar. Saring menurut status, rentang tanggal daftar, desa, kampus, dan angkatan (ejaan berbeda seperti "Desa Sukamaju"/"desa sukamaju" digabung); jumlah hasil dihitung langsung. Pilih tampilan *rekap tabel* atau *detail per orang* (dengan gambar bukti follow), kelompokkan per desa/kampus/angkatan/status, urut terbaru/terlama/nama. Opsi isi: ringkasan statistik (total, per status, desa, kampus, angkatan, tren bulanan), alasan bergabung, kontak, catatan internal, dan kolom tanda tangan Ketua Umum/Sekretaris. Tidak butuh perubahan database.
- **Bersihkan bukti follow** yang lebih lama dari 30/90/180/365 hari setelah diarsipkan ke PDF. Menghapus pendaftar juga menghapus berkas buktinya.
- **Cadangan JSON** seluruh tabel (untuk pemulihan oleh teknisi).

## Fitur Admin Panel (`/admin`)
Tampilan bergaya Apple: netral abu-putih, satu warna biru, font sistem Apple (SF Pro di perangkat Apple, Inter di lainnya). Gaya terkurung di `src/app/admin/admin.css` (kelas `ad-*`, hanya aktif di bawah `.adm`). Di HP, tabel berubah jadi daftar kartu dan formulir tambah/edit muncul sebagai lembar dari bawah dengan isi yang bisa di-scroll.
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
Hapus folder lama `src/app/berita` dan `src/app/daftar` jika masih ada (sudah pindah ke `src/app/(site)/`).

Jalankan ulang seluruh `supabase/schema.sql` di SQL Editor (aman diulang; tidak menghapus data). Wajib untuk versi ini (v11): kolom HTM `site_settings.registration_fee / payment_info / payment_qr`, kolom `registrations.payment_proof / fee_amount`, dan aturan RLS pendaftaran yang diperbarui. Kolom `payment_status` dari v10 otomatis dibuang (statusnya tidak dipakai lagi). Sebelumnya: kolom `registrations.follow_proof`, kolom pengaturan pendaftaran (`registration_open`, `registration_mode`, `gform_url`, `registration_note`), bucket privat `bukti`, dan fungsi `admin_usage`. Sebelumnya menambah kolom `gallery.featured` dan `gallery.visible`, tabel `registrations` & `daily_stats`, fungsi `track_view` dan `admin_stats`.

## Struktur kode
```
supabase/schema.sql         skema + RLS + storage (jalankan sekali)
src/proxy.ts                penjaga /admin (Next 16: pengganti middleware)
src/lib/supabase/           client publik / server / browser / session
src/lib/data.ts             pengambilan data publik (+ fallback data contoh)
src/lib/admin/schema.ts     definisi resource admin (form, kolom, validasi)
src/lib/admin/actions.ts    Server Actions (simpan, hapus, urut, pengaturan, login)
src/app/(site)/             semua halaman publik (layout bersama navbar+footer), berita/[slug]
src/app/                    feed.xml, opengraph-image, manifest, sitemap, robots
src/lib/routes.ts           daftar menu navbar/footer/sitemap
src/components/            komponen publik (History, Agenda, Countdown, Gallery, ...)
src/lib/date.ts             utilitas tanggal WIB, hitung hari, tautan Google Calendar
src/app/admin/              login + (panel): dashboard, CRUD, pendaftar (+CSV), pesan, pengaturan, log; backup/ (unduh JSON)
src/app/api/track           pencacah kunjungan (tanpa cookie) → RPC track_view
src/app/(site)/daftar       formulir pendaftaran anggota
src/components/admin/charts grafik SVG ringan (area, donat, batang, sparkline)
```
Menambah jenis konten baru (mis. "Alumni") cukup: tabel baru di SQL + satu entri di `RESOURCES` + satu file `page.tsx` tipis.


## Sistem animasi

Semua animasi publik digerakkan atribut `data-*` yang dibaca `src/components/Motion.tsx` (±5 KB, tanpa library), sehingga HTML tetap lengkap untuk SEO:

| Atribut | Efek |
|---|---|
| `data-a="up\|left\|right\|zoom\|blur\|clip\|fade\|bar"` | muncul saat masuk layar (`data-d` = jeda ms; induk ber-`data-stagger="70"` membuat anak muncul berurutan) |
| `<Split>` | judul naik per kata / kalimat terisi per kata saat scroll (`mode="fill"`) |
| `data-px="0.12"` | parallax vertikal |
| `data-scrub="0.7"` | variabel `--p` 0→1 (garis timeline) |
| `data-tilt` / `data-magnetic` / `data-cursor="Teks"` | kartu 3D, tombol magnet, label cincin kursor |
| `data-hero` / `data-skew` | gerak hero (scroll + kursor), pita teks miring mengikuti kecepatan scroll |

Animasi menyala lewat skrip kecil di `<head>` (`<html class="m">`) dan **otomatis mati** bila pengguna memilih "kurangi gerakan" di sistemnya atau JS gagal (konten tetap tampil). Untuk mematikan semuanya, hapus `<Motion />`/`<Intro />` dari `src/app/(site)/layout.tsx`.
