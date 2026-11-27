-- 일기와 캘린더 일정에 사진을 붙일 칸을 추가한다 (사진 파일은 저장소 'photos')
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다. 여러 번 실행해도 안전하다.
alter table public.diaries add column if not exists photos text[] not null default '{}';
alter table public.events  add column if not exists photos text[] not null default '{}';
