-- 데이트 지도: 지역(시·군·구)별 데이트 기록
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  region_code text not null check (region_code ~ '^[0-9]{5}$'),   -- data/regions.json 의 시·군·구 코드
  title text not null check (char_length(title) between 1 and 40),
  start_date date not null,
  end_date date not null,
  memo text not null default '' check (char_length(memo) <= 2000),
  photos text[] not null default '{}',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index trips_couple on public.trips (couple_id, region_code);
alter table public.trips enable row level security;
create policy "우리 커플 데이트 기록" on public.trips for all to authenticated
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
grant select, insert, update, delete on public.trips to authenticated;
