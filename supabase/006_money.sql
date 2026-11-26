-- 3단계 A: 데이트 가계부 (데이트 묶음 + 지출 항목)
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 한다.

create table public.money_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  start_date date not null,
  end_date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.money_expenses (
  id uuid primary key default gen_random_uuid(),
  date_id uuid not null references public.money_dates(id) on delete cascade,
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  payer_id uuid references auth.users(id) on delete set null,   -- 낸 사람. 비어 있으면 '함께'
  amount integer not null check (amount > 0 and amount <= 100000000),
  title text not null check (char_length(title) between 1 and 40),
  category text not null default '기타',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index money_dates_couple on public.money_dates (couple_id, start_date desc);
create index money_expenses_date on public.money_expenses (date_id, created_at);

alter table public.money_dates enable row level security;
alter table public.money_expenses enable row level security;

create policy "우리 커플 데이트" on public.money_dates
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());
create policy "우리 커플 지출" on public.money_expenses
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

grant select, insert, update, delete on public.money_dates to authenticated;
grant select, insert, update, delete on public.money_expenses to authenticated;
