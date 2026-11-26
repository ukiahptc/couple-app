-- 2단계 B: 캘린더 일정 테이블
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 한다.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,  -- 누구 일정인지. 비어 있으면 '우리'
  title text not null check (char_length(title) between 1 and 60),
  start_date date not null,
  start_time time,                                             -- 비어 있으면 하루 종일
  end_date date not null,
  end_time time,
  repeat_rule text not null default 'none'
    check (repeat_rule in ('none', 'weekly', 'monthly', 'yearly')),
  memo text check (memo is null or char_length(memo) <= 500),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.events enable row level security;

-- 내 커플의 일정만 보고, 만들고, 고치고, 지울 수 있다
create policy "우리 커플 일정" on public.events
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

grant select, insert, update, delete on public.events to authenticated;
