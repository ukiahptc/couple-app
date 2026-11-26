-- 로그인한 사용자가 테이블을 읽을 수 있게 권한을 준다.
-- (새 Supabase 프로젝트는 새 테이블에 기본 권한을 자동으로 주지 않는다.
--  실제로 볼 수 있는 행은 001의 접근 규칙이 내 커플 것으로 제한한다.)
grant usage on schema public to authenticated;
grant select on public.couples, public.members to authenticated;
grant update (start_date) on public.couples to authenticated;
grant update (nickname) on public.members to authenticated;
grant execute on function public.my_couple_id() to authenticated;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;
