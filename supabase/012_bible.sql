-- 성경 통독표: 누가 어느 책 몇 장을 언제 읽었는지 저장한다
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.bible_reads (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book smallint not null check (book between 1 and 66),
  chapter smallint not null check (chapter between 1 and 150),
  read_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, book, chapter)
);
create index bible_reads_couple on public.bible_reads (couple_id);
alter table public.bible_reads enable row level security;
-- 둘 다 서로의 기록을 볼 수 있고, 체크와 취소는 자기 것만 할 수 있다.
create policy "우리 커플 통독 보기" on public.bible_reads for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "내 통독 체크" on public.bible_reads for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "내 통독 취소" on public.bible_reads for delete to authenticated
  using (user_id = auth.uid());
grant select, insert, delete on public.bible_reads to authenticated;
