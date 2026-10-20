-- OPSIONAL: contoh konten supaya website tidak kosong saat pertama kali dibuka.
-- Semua bisa diedit / dihapus dari Admin Panel.

insert into public.members (name, position, division, period, order_index) values
 ('Nama Ketua', 'Ketua Umum', 'Presidium', '2025/2026', 1),
 ('Nama Wakil', 'Wakil Ketua', 'Presidium', '2025/2026', 2),
 ('Nama Sekretaris', 'Sekretaris Umum', 'Presidium', '2025/2026', 3),
 ('Nama Bendahara', 'Bendahara Umum', 'Presidium', '2025/2026', 4),
 ('Nama Kabid', 'Kepala Bidang', 'Pendidikan & Pengembangan Diri', '2025/2026', 5),
 ('Nama Kabid', 'Kepala Bidang', 'Sosial & Pengabdian', '2025/2026', 6),
 ('Nama Kabid', 'Kepala Bidang', 'Hubungan Daerah & Alumni', '2025/2026', 7),
 ('Nama Kabid', 'Kepala Bidang', 'Media & Kreatif', '2025/2026', 8);

insert into public.programs (name, description, icon, division, period, status) values
 ('Penyambutan Mahasiswa Baru', 'Menyambut mahasiswa baru asal Cempaka: pengenalan keluarga, pendampingan awal kuliah, dan info kampus.', 'users', 'Hubungan Daerah & Alumni', '2025/2026', 'ongoing'),
 ('Bakti Sosial Cempaka', 'Kegiatan sosial dan pengabdian langsung bagi masyarakat di Kecamatan Cempaka.', 'share-2', 'Sosial & Pengabdian', '2025/2026', 'upcoming'),
 ('Kelas Belajar Bersama', 'Sesi belajar, berbagi tips kuliah, dan persiapan beasiswa antar anggota.', 'book-open', 'Pendidikan & Pengembangan Diri', '2025/2026', 'ongoing'),
 ('Malam Keakraban', 'Acara tahunan untuk mempererat kebersamaan seluruh anggota KMKC.', 'trophy', 'Presidium', '2025/2026', 'upcoming');

insert into public.articles (title, slug, excerpt, content, author, category, published, published_at) values
 ('Selamat Datang di Website KMKC', 'selamat-datang-di-website-kmkc',
  'Website resmi Keluarga Mahasiswa Kecamatan Cempaka kini hadir sebagai pusat informasi kegiatan dan kabar terbaru.',
  E'Website resmi **KMKC** kini hadir.\n\nDi sini kamu bisa mengikuti kabar terbaru, melihat dokumentasi kegiatan, mengenal pengurus, dan menghubungi kami.\n\n- Informasi kegiatan\n- Dokumentasi acara\n- Kontak pengurus',
  'Media & Kreatif', 'Pengumuman', true, current_date);
