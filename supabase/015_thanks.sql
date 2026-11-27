-- 감사 쪽지: 하루에 몇 장이든 짧게 적어 항아리에 모은다
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  thank_date date not null default current_date,
  body text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);
create index thanks_couple on public.thanks (couple_id, thank_date desc);
alter table public.thanks enable row level security;
create policy "감사 쪽지 읽기" on public.thanks for select to authenticated using (couple_id = public.my_couple_id());
create policy "감사 쪽지 쓰기" on public.thanks for insert to authenticated with check (couple_id = public.my_couple_id() and user_id = auth.uid());
create policy "내 감사 쪽지 지우기" on public.thanks for delete to authenticated using (couple_id = public.my_couple_id() and user_id = auth.uid());
grant select, insert, delete on public.thanks to authenticated;
