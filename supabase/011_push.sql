-- 알림: 기기마다 알림 받을 주소를 저장한다
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_couple on public.push_subscriptions (couple_id);
alter table public.push_subscriptions enable row level security;
-- 자기 기기 주소만 보고 넣고 지울 수 있다. 상대방 주소는 서버 함수만 읽는다.
create policy "내 기기 알림 주소" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());
grant select, insert, update, delete on public.push_subscriptions to authenticated;
