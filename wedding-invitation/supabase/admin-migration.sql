
-- BẢO ĐIỀN & HẢI YẾN — ADMIN MIGRATION
-- Chạy script này sau schema.sql trong Supabase SQL Editor.
-- Admin user hiện tại:
-- e341f7e3-d25f-41ee-ac0f-c4dcfa3994c8

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users (user_id)
values ('e341f7e3-d25f-41ee-ac0f-c4dcfa3994c8')
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can manage media" on public.media;
create policy "Admins can manage media"
on public.media for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage albums" on public.albums;
create policy "Admins can manage albums"
on public.albums for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read rsvps" on public.rsvps;
create policy "Admins can read rsvps"
on public.rsvps for select
to authenticated
using (public.is_admin());

-- Storage policies cho admin.
drop policy if exists "Admins can manage wedding photos" on storage.objects;
create policy "Admins can manage wedding photos"
on storage.objects for all
to authenticated
using (
  bucket_id = 'wedding-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'wedding-photos'
  and public.is_admin()
);

drop policy if exists "Admins can manage wedding videos" on storage.objects;
create policy "Admins can manage wedding videos"
on storage.objects for all
to authenticated
using (
  bucket_id = 'wedding-videos'
  and public.is_admin()
)
with check (
  bucket_id = 'wedding-videos'
  and public.is_admin()
);

-- Cho guest upload vào đúng bucket mà không cần đăng nhập.
drop policy if exists "Anyone can upload wedding photos" on storage.objects;
create policy "Anyone can upload wedding photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'wedding-photos');

drop policy if exists "Anyone can upload wedding videos" on storage.objects;
create policy "Anyone can upload wedding videos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'wedding-videos');
