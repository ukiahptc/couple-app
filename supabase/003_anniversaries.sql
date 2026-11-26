-- 2단계 A: 기념일 테이블
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 한다.

create table public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 30),
  date date not null,
  repeat_yearly boolean not null default false,   -- 매년 돌아오는 날 (생일 등)
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.anniversaries enable row level security;

-- 내 커플의 기념일만 보고, 만들고, 고치고, 지울 수 있다
create policy "우리 커플 기념일" on public.anniversaries
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

grant select, insert, update, delete on public.anniversaries to authenticated;
