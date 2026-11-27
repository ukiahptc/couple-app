-- 맛집 기록장 + 사진 저장소
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.places (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  category text not null default '음식점',
  again boolean not null default false,              -- 또갈집
  visit_date date not null,
  rating smallint not null default 0 check (rating between 0 and 5),
  memo text not null default '' check (char_length(memo) <= 2000),
  link text not null default '' check (char_length(link) <= 500),
  photos text[] not null default '{}',               -- 저장소 안의 사진 경로
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index places_couple on public.places (couple_id, visit_date desc);
alter table public.places enable row level security;
create policy "우리 커플 맛집" on public.places for all to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
grant select, insert, update, delete on public.places to authenticated;

-- 사진 저장소: 비공개. 파일 경로의 첫 폴더가 우리 커플 id 인 것만 보고 올리고 지울 수 있다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "우리 커플 사진 보기" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "우리 커플 사진 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "우리 커플 사진 지우기" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
