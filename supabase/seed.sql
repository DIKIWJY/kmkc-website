-- OPSIONAL: contoh konten supaya website tidak kosong saat pertama kali dibuka.
-- Semua bisa diedit / dihapus dari Admin Panel. Jalankan SEKALI saja (menjalankan ulang akan menggandakan pengurus, program, dan berita contoh).

-- Periode dan bidang harus ada lebih dulu karena pengurus terhubung ke bidangnya (struktur v11).
insert into public.periods (label, is_current) values ('2025/2026', true) on conflict do nothing;

insert into public.divisions (period, name, description, order_index) values
 ('2025/2026', 'Pengurus Inti', 'Pimpinan inti KMKC', 1),
 ('2025/2026', 'Departemen Pendidikan', '', 2),
 ('2025/2026', 'Departemen PKMB', '', 3),
 ('2025/2026', 'Departemen Humas', '', 4),
 ('2025/2026', 'Departemen Medinfo', '', 5),
 ('2025/2026', 'Departemen Kewirausahaan', '', 6),
 ('2025/2026', 'Departemen Kesehatan', '', 7)
on conflict do nothing;

insert into public.members (name, position, division, period, order_index) values
 ('Nama Ketua', 'Ketua Umum', 'Pengurus Inti', '2025/2026', 1),
 ('Nama Wakil', 'Wakil Ketua Umum 1', 'Pengurus Inti', '2025/2026', 2),
 ('Nama Sekretaris', 'Sekretaris Umum 1', 'Pengurus Inti', '2025/2026', 3),
 ('Nama Bendahara', 'Bendahara Umum', 'Pengurus Inti', '2025/2026', 4),
 ('Nama Ketua Departemen', 'Ketua Departemen', 'Departemen Pendidikan', '2025/2026', 5),
 ('Nama Ketua Departemen', 'Ketua Departemen', 'Departemen PKMB', '2025/2026', 6),
 ('Nama Ketua Departemen', 'Ketua Departemen', 'Departemen Humas', '2025/2026', 7),
 ('Nama Ketua Departemen', 'Ketua Departemen', 'Departemen Medinfo', '2025/2026', 8);

insert into public.programs (name, description, icon, division, period, status) values
 ('Penyambutan Mahasiswa Baru', 'Menyambut mahasiswa baru asal Cempaka: pengenalan keluarga, pendampingan awal kuliah, dan info kampus.', 'users', 'Departemen Humas', '2025/2026', 'ongoing'),
 ('Bakti Sosial Cempaka', 'Kegiatan sosial dan pengabdian langsung bagi masyarakat di Kecamatan Cempaka.', 'share-2', 'Departemen PKMB', '2025/2026', 'upcoming'),
 ('Kelas Belajar Bersama', 'Sesi belajar, berbagi tips kuliah, dan persiapan beasiswa antar anggota.', 'book-open', 'Departemen Pendidikan', '2025/2026', 'ongoing'),
 ('Malam Keakraban', 'Acara tahunan untuk mempererat kebersamaan seluruh anggota KMKC.', 'trophy', 'Pengurus Inti', '2025/2026', 'upcoming');

insert into public.articles (title, slug, excerpt, content, author, category, published, published_at) values
 ('Selamat Datang di Website KMKC', 'selamat-datang-di-website-kmkc',
  'Website resmi Keluarga Mahasiswa Kecamatan Cempaka kini hadir sebagai pusat informasi kegiatan dan kabar terbaru.',
  E'Website resmi **KMKC** kini hadir.\n\nDi sini kamu bisa mengikuti kabar terbaru, melihat dokumentasi kegiatan, mengenal pengurus, dan menghubungi kami.\n\n- Informasi kegiatan\n- Dokumentasi acara\n- Kontak pengurus',
  'Departemen Medinfo', 'Pengumuman', true, current_date);