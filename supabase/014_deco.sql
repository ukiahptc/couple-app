-- 성경책 꾸미기: 둘이 고른 배경과 아이템을 커플 정보에 저장한다
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다. 여러 번 실행해도 안전하다.
alter table public.couples add column if not exists deco jsonb not null default '{}'::jsonb;
grant update (deco) on public.couples to authenticated;
