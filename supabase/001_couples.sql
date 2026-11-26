-- 1단계: 커플 연결용 테이블과 규칙
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 한다.

-- 커플 1쌍 = 1행
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  start_date date,                       -- 사귄 날 (디데이용, 2단계에서 사용)
  created_at timestamptz not null default now()
);

-- 사용자 1명 = 1행. 어느 커플에 속하는지 기록
create table public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  nickname text not null,
  joined_at timestamptz not null default now()
);

alter table public.couples enable row level security;
alter table public.members enable row level security;

-- 로그인한 사용자의 커플 id. 이후 모든 테이블의 접근 규칙이 이 함수를 쓴다.
create function public.my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from public.members where user_id = auth.uid()
$$;

-- 접근 규칙: 내 커플의 데이터만 보인다
create policy "내 커플만 조회" on public.couples
  for select to authenticated using (id = public.my_couple_id());
create policy "내 커플만 수정" on public.couples
  for update to authenticated
  using (id = public.my_couple_id()) with check (id = public.my_couple_id());
create policy "우리 커플 멤버만 조회" on public.members
  for select to authenticated using (couple_id = public.my_couple_id());
create policy "내 닉네임만 수정" on public.members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- 앱에서 직접 바꿀 수 있는 칸을 제한 (초대 코드, 소속 커플은 못 바꿈)
revoke insert, update, delete on public.couples from authenticated, anon;
revoke insert, update, delete on public.members from authenticated, anon;
grant update (start_date) on public.couples to authenticated;
grant update (nickname) on public.members to authenticated;

-- 새 커플 만들기: 초대 코드 6자리를 돌려준다
create function public.create_couple(p_nickname text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_couple uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception '이미 커플에 연결되어 있습니다';
  end if;
  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    begin
      insert into couples (invite_code) values (v_code) returning id into v_couple;
      exit;
    exception when unique_violation then
      -- 코드가 겹치면 다시 만든다
    end;
  end loop;
  insert into members (user_id, couple_id, nickname)
    values (auth.uid(), v_couple, trim(p_nickname));
  return v_code;
end $$;

-- 초대 코드로 들어가기: 커플당 2명까지만
create function public.join_couple(p_code text, p_nickname text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_couple uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception '이미 커플에 연결되어 있습니다';
  end if;
  select id into v_couple from couples
    where invite_code = upper(trim(p_code)) for update;
  if v_couple is null then raise exception '초대 코드를 찾을 수 없습니다'; end if;
  if (select count(*) from members where couple_id = v_couple) >= 2 then
    raise exception '이미 두 명이 연결된 코드입니다';
  end if;
  insert into members (user_id, couple_id, nickname)
    values (auth.uid(), v_couple, trim(p_nickname));
end $$;

revoke execute on function public.create_couple(text) from public, anon;
revoke execute on function public.join_couple(text, text) from public, anon;
revoke execute on function public.my_couple_id() from public, anon;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;
grant execute on function public.my_couple_id() to authenticated;
