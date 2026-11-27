-- 사진 앨범 (사진 파일은 007 에서 만든 저장소 'photos' 에 들어간다)
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.album_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  path text not null,                 -- 큰 사진
  thumb text not null,                -- 목록용 작은 사진
  taken_date date not null,
  caption text not null default '' check (char_length(caption) <= 200),
  uploaded_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index album_photos_couple on public.album_photos (couple_id, taken_date desc);
alter table public.album_photos enable row level security;
create policy "우리 커플 앨범" on public.album_photos for all to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
grant select, insert, update, delete on public.album_photos to authenticated;
