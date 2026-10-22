-- Isi kontak resmi KMKC ke database yang sudah berjalan (aman diulang).
-- Jalankan di Supabase → SQL Editor. Alternatif tanpa SQL: Admin → Pengaturan → Kontak & media sosial.
update public.site_settings set
  email     = 'kmkcjayajaya@gmail.com',
  address   = 'TPA Sija Carana',
  instagram = 'https://www.instagram.com/kmkc.id',
  tiktok    = 'https://www.tiktok.com/@kmkc_18',
  whatsapp  = 'https://wa.me/qr/VPQNDHKWIN6VC1'
where id = 1;
