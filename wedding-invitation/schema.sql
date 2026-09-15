
-- BẢO ĐIỀN & HẢI YẾN — SUPABASE V2
-- Chạy toàn bộ script này trong Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image text,
  created_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  file_url text,
  file_path text,
  file_type text not null check (file_type in ('image','video')),
  guest_name text,
  message text,
  source text not null default 'guest' check (source in ('guest','couple')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  album_id uuid references public.albums(id) on delete set null,
  caption text,
  featured boolean not null default false
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  attending boolean not null,
  guests integer not null default 1 check (guests between 1 and 20),
  message text
);

alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.rsvps enable row level security;

-- PUBLIC: chỉ đọc album và media đã duyệt.
create policy "Public can read albums"
on public.albums for select
to anon, authenticated
using (true);

create policy "Public can read approved media"
on public.media for select
to anon, authenticated
using (status = 'approved');

-- GUEST: được gửi RSVP.
create policy "Anyone can submit RSVP"
on public.rsvps for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 120
  and guests between 1 and 20
);

-- GUEST: được tạo media ở trạng thái pending.
create policy "Anyone can submit guest media"
on public.media for insert
to anon, authenticated
with check (
  source = 'guest'
  and status = 'pending'
  and char_length(coalesce(guest_name,'')) between 1 and 120
);

-- ADMIN:
-- Các thao tác approve/reject/delete/update nên thực hiện bằng
-- Supabase Auth + policy theo user/role ở bước Admin V2.
-- KHÔNG đặt service_role key trong frontend.

-- Storage:
-- Tạo 2 buckets trong Dashboard:
-- wedding-photos
-- wedding-videos
--
-- Sau khi tạo buckets, áp dụng Storage policies riêng.
-- Không dùng service_role key ở client.

-- STORAGE POLICIES cho guest upload.
-- Chạy phần này sau khi đã tạo 2 bucket.
create policy "Anyone can upload wedding photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'wedding-photos');

create policy "Anyone can upload wedding videos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'wedding-videos');
