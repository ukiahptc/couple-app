-- 알림 기록: 상대방 활동과 포인트 사용 내역을 앱 안 알림 창에 쌓는다
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  body text not null default '' check (char_length(body) <= 160),
  url text not null default '#/',
  created_at timestamptz not null default now()
);
create index notices_couple on public.notices (couple_id, created_at desc);
alter table public.notices enable row level security;
create policy "알림 읽기" on public.notices for select to authenticated using (couple_id = public.my_couple_id());
create policy "알림 쓰기" on public.notices for insert to authenticated with check (couple_id = public.my_couple_id() and user_id = auth.uid());
create policy "알림 지우기" on public.notices for delete to authenticated using (couple_id = public.my_couple_id());
grant select, insert, delete on public.notices to authenticated;
