-- ============================================================
-- KMKC — Keluarga Mahasiswa Kecamatan Cempaka
-- Skema database Supabase. Jalankan SEKALI di SQL Editor.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- ---------- 1. Admin allowlist ----------
-- Hanya user yang terdaftar di tabel ini yang boleh mengubah data,
-- walaupun user lain berhasil login/daftar di Supabase Auth.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- 2. Pengaturan situs (singleton: hanya 1 baris) ----------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'KMKC',
  full_name text not null default 'Keluarga Mahasiswa Kecamatan Cempaka',
  tagline text not null default '',
  about text not null default '',
  vision text not null default '',
  mission text[] not null default '{}',
  stats jsonb not null default '[]',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  instagram text not null default '',
  tiktok text not null default '',
  youtube text not null default '',
  whatsapp text not null default '',
  about_photo text not null default '',
  history text not null default '',
  founders jsonb not null default '[]',
  timeline jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- (untuk database yang sudah dibuat dengan versi lama skema ini)
alter table public.site_settings add column if not exists history text not null default '';
alter table public.site_settings add column if not exists founders jsonb not null default '[]';
alter table public.site_settings add column if not exists timeline jsonb not null default '[]';

-- ---------- 3. Konten ----------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  position text not null default '',
  division text not null default '',
  photo_url text not null default '',
  period text not null default '',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  icon text not null default 'briefcase',
  division text not null default '',
  period text not null default '',
  status text not null default 'upcoming' check (status in ('upcoming','ongoing','completed')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  image_url text not null default '',
  event_date date,
  category text not null default 'Acara' check (category in ('Acara','Kegiatan')),
  featured boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gallery add column if not exists featured boolean not null default false;
alter table public.gallery add column if not exists visible boolean not null default true;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content text not null default '',
  cover_image text not null default '',
  author text not null default '',
  category text not null default 'Artikel',
  published boolean not null default false,
  published_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  location text not null default '',
  event_date date not null,
  event_time text not null default '',
  cover_image text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- 4. Pesan masuk & log aktivitas ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_email text not null default '',
  action text not null,          -- tambah | ubah | hapus | ...
  entity text not null,          -- nama resource, mis. "Pengurus"
  label text not null default '',-- judul/nama record
  created_at timestamptz not null default now()
);

-- ---------- 4b. Pendaftar anggota & statistik pengunjung ----------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null check (char_length(phone) between 6 and 24),
  email text not null default '' check (char_length(email) <= 200),
  village text not null default '' check (char_length(village) <= 120),
  campus text not null default '' check (char_length(campus) <= 160),
  major text not null default '' check (char_length(major) <= 160),
  batch text not null default '' check (char_length(batch) <= 20),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'baru' check (status in ('baru','dihubungi','diterima','ditolak')),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists registrations_created_idx on public.registrations (created_at desc);

-- Statistik pengunjung ringan & ramah privasi: hanya agregat harian, tanpa IP/cookie pelacak.
create table if not exists public.daily_stats (
  day date not null,
  path text not null check (char_length(path) between 1 and 200),
  device text not null check (device in ('mobile','tablet','desktop')),
  source text not null default 'langsung' check (source in ('langsung','instagram','whatsapp','google','facebook','tiktok','youtube','lainnya')),
  views integer not null default 0,
  visitors integer not null default 0,
  primary key (day, path, device, source)
);

-- Dipanggil anonim lewat /api/track. Menolak path tak dikenal (mencegah tabel dibanjiri baris acak).
create or replace function public.track_view(p_path text, p_device text, p_source text default 'langsung', p_new_visitor boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_source text := case when p_source in ('langsung','instagram','whatsapp','google','facebook','tiktok','youtube') then p_source else 'lainnya' end;
begin
  if p_device not in ('mobile','tablet','desktop') then return; end if;
  if p_path !~ '^/(berita(/[a-z0-9]+(-[a-z0-9]+)*)?|daftar)?$' then return; end if;
  if p_path like '/berita/%' and not exists (select 1 from public.articles where slug = substr(p_path, 9) and published) then return; end if;
  insert into public.daily_stats (day, path, device, source, views, visitors)
  values (v_day, p_path, p_device, v_source, 1, case when p_new_visitor then 1 else 0 end)
  on conflict (day, path, device, source) do update
    set views = public.daily_stats.views + 1,
        visitors = public.daily_stats.visitors + case when p_new_visitor then 1 else 0 end;
end;
$$;
revoke all on function public.track_view(text, text, text, boolean) from public;
grant execute on function public.track_view(text, text, text, boolean) to anon, authenticated;

-- Ringkasan statistik untuk dashboard admin (diagregasi di database, jadi tetap cepat walau datanya banyak).
create or replace function public.admin_stats(p_days integer default 180)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_from date := v_today - (greatest(1, least(p_days, 365)) - 1);
  v_30 date := v_today - 29;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'views', v, 'visitors', u) order by day)
                       from (select day, sum(views)::int v, sum(visitors)::int u from public.daily_stats where day >= v_from group by day) d), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(jsonb_build_object('key', device, 'views', v) order by v desc)
                         from (select device, sum(views)::int v from public.daily_stats where day >= v_30 group by device) d), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('key', source, 'views', v) order by v desc)
                         from (select source, sum(views)::int v from public.daily_stats where day >= v_30 group by source) d), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('key', path, 'views', v) order by v desc)
                       from (select path, sum(views)::int v from public.daily_stats where day >= v_30 group by path order by v desc limit 8) d), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_stats(integer) from public;
grant execute on function public.admin_stats(integer) to authenticated;

create index if not exists events_date_idx on public.events (event_date);
create index if not exists members_order_idx on public.members (order_index);
create index if not exists gallery_date_idx on public.gallery (event_date desc);
create index if not exists articles_pub_idx on public.articles (published, published_at desc);
create index if not exists messages_created_idx on public.contact_messages (created_at desc);

-- ---------- 5. Row Level Security ----------
alter table public.admins            enable row level security;
alter table public.site_settings     enable row level security;
alter table public.members           enable row level security;
alter table public.programs          enable row level security;
alter table public.gallery           enable row level security;
alter table public.events            enable row level security;
alter table public.articles          enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.audit_log         enable row level security;
alter table public.registrations     enable row level security;
alter table public.daily_stats       enable row level security;

-- Hapus policy lama bila skrip dijalankan ulang
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('admins','site_settings','members','programs','gallery','events','articles','contact_messages','audit_log','registrations','daily_stats')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Publik: hanya boleh BACA konten
create policy "public read settings" on public.site_settings for select using (true);
create policy "public read members"  on public.members  for select using (true);
create policy "public read programs" on public.programs for select using (true);
create policy "public read gallery"  on public.gallery  for select using (visible = true or public.is_admin());
create policy "public read events"   on public.events   for select using (true);
create policy "public read articles" on public.articles for select using (published = true or public.is_admin());

-- Publik: boleh KIRIM pesan (dengan batasan panjang di tabel), tidak boleh membaca
create policy "public send message" on public.contact_messages for insert
  to anon, authenticated with check (is_read = false);

-- Admin: akses penuh
create policy "admin all settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all members"  on public.members  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all programs" on public.programs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all gallery"  on public.gallery  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all events"   on public.events   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all articles" on public.articles for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all messages" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read audit"   on public.audit_log for select using (public.is_admin());
create policy "admin write audit"  on public.audit_log for insert with check (public.is_admin());
create policy "public register" on public.registrations for insert
  to anon, authenticated with check (status = 'baru' and note = '');
create policy "admin all registrations" on public.registrations for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read stats" on public.daily_stats for select using (public.is_admin());
create policy "admin read self"    on public.admins for select using (user_id = auth.uid());

-- ---------- 6. Storage (foto) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------- 7. Data awal pengaturan ----------
insert into public.site_settings (id, name, full_name, tagline, about, vision, mission, stats, history, founders, timeline, email, phone, address, instagram)
values (
  1,
  'KMKC',
  'Keluarga Mahasiswa Kecamatan Cempaka',
  'Rumah bersama mahasiswa Cempaka di perantauan — saling menguatkan, tumbuh, dan berbagi untuk daerah.',
  E'**KMKC** adalah wadah **silaturahmi** dan **kekeluargaan** bagi mahasiswa asal Kecamatan Cempaka dari **13 desa** dan beragam perguruan tinggi. Berdiri sejak **2008**, kami tumbuh menjadi rumah bersama bagi mahasiswa Cempaka di perantauan.\n\nKami percaya setiap anggota punya potensi. Lewat **pengembangan diri**, **kegiatan sosial**, dan **kolaborasi**, kami ingin setiap mahasiswa Cempaka tumbuh dan memberi **dampak nyata** bagi daerah asalnya.',
  'Menjadi keluarga mahasiswa yang **solid**, **berprestasi**, dan **berkontribusi nyata** bagi kemajuan Kecamatan Cempaka.',
  array[
    'Mempererat tali silaturahmi dan kekeluargaan antar mahasiswa Cempaka',
    'Mendorong prestasi akademik dan pengembangan diri anggota',
    'Menjadi jembatan informasi antara mahasiswa dan masyarakat Cempaka',
    'Menyelenggarakan kegiatan sosial dan pengabdian untuk daerah',
    'Membangun jejaring dengan alumni, kampus, dan mitra',
    'Menjaga organisasi yang transparan, inklusif, dan profesional'
  ],
  '[{"value": "2008", "label": "Tahun berdiri"}, {"value": "13", "label": "Desa"}, {"value": "8", "label": "Penggagas"}]'::jsonb,
  E'**KMKC** dilahirkan pada **Musyawarah Besar perdana** tanggal **27 Januari 2008** di Taman Bacaan Masyarakat Desa Cempaka, dihadiri tidak kurang dari **50 mahasiswa** dari **13 desa** di Kecamatan Cempaka. Berawal dari obrolan ringan para mahasiswa di perantauan, lahirlah rumah bersama yang terus tumbuh hingga hari ini.',
  '[{"name": "Ardiansyah", "campus": "FKIP Unsri"}, {"name": "Rafelta Tuska Putra", "campus": "FP Unsri", "role": "Ketua Umum pertama"}, {"name": "Agus Sai", "campus": "FT Unsri"}, {"name": "Herianto", "campus": "FT Unsri"}, {"name": "Beni Wirayudha", "campus": "FP Unsri"}, {"name": "Novaria Pajrini", "campus": "FH Unsri"}, {"name": "Putri Eka Sevtiyuni", "campus": "Fasilkom Unsri"}, {"name": "Lisa Selpiyani", "campus": "FE Unsri"}]'::jsonb,
    '[{"date": "Sebelum Januari 2008", "title": "Gagasan lahir dari obrolan reuni", "desc": "Bincang-bincang ringan di beberapa reuni mahasiswa Cempaka memunculkan keinginan untuk punya wadah bersama di perantauan."}, {"date": "20 Januari 2008", "title": "Pertemuan persiapan pembentukan", "desc": "Digelar pertemuan persiapan pembentukan **Himpunan Mahasiswa Cempaka** (nama awal) di rumah kos seorang kawan. Di sinilah disepakati nama **Keluarga Mahasiswa Kecamatan Cempaka (KMKC)**."}, {"date": "20 – 27 Januari 2008", "title": "Delapan penggagas merumuskan ide", "desc": "Delapan mahasiswa memformulasikan gagasan tersebut hingga disepakati Musyawarah Besar seminggu setelahnya."}, {"date": "27 Januari 2008", "title": "Musyawarah Besar perdana", "desc": "Bertempat di Taman Bacaan Masyarakat Desa Cempaka, dihadiri tidak kurang dari **50 mahasiswa** dari **13 desa** di Kecamatan Cempaka."}, {"date": "27 Januari 2008", "title": "AD/ART disahkan, Ketua Umum pertama terpilih", "desc": "Forum merumuskan **AD/ART** organisasi dan memilih **Rafelta Tuska Putra** sebagai Ketua Umum pertama KMKC."}]'::jsonb,
  'kmkc@example.com', '', 'Kecamatan Cempaka', ''
)
on conflict (id) do nothing;

-- ============================================================
-- LANGKAH TERAKHIR (manual, setelah membuat user di Authentication → Users):
--   insert into public.admins (user_id, email)
--   select id, email from auth.users where email = 'EMAIL_ADMIN_KAMU';
-- ============================================================
