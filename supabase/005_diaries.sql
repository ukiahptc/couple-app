-- 2단계 C: 커플 일기장 (일기 + 댓글)
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 한다.

create table public.diaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '' check (char_length(body) <= 5000),
  entry_date date not null,
  entry_time time not null,
  created_at timestamptz not null default now()
);

create table public.diary_comments (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diaries(id) on delete cascade,
  couple_id uuid not null default public.my_couple_id()
    references public.couples(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index diaries_couple_date on public.diaries (couple_id, entry_date desc, entry_time desc);
create index diary_comments_diary on public.diary_comments (diary_id, created_at);

alter table public.diaries enable row level security;
alter table public.diary_comments enable row level security;

-- 읽기: 우리 커플의 글 전부. 쓰기·고치기·지우기: 자기가 쓴 글만
create policy "일기 읽기" on public.diaries for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "일기 쓰기" on public.diaries for insert to authenticated
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 일기 고치기" on public.diaries for update to authenticated
  using (couple_id = public.my_couple_id() and author_id = auth.uid())
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 일기 지우기" on public.diaries for delete to authenticated
  using (couple_id = public.my_couple_id() and author_id = auth.uid());

create policy "댓글 읽기" on public.diary_comments for select to authenticated
  using (couple_id = public.my_couple_id());
create policy "댓글 쓰기" on public.diary_comments for insert to authenticated
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 댓글 지우기" on public.diary_comments for delete to authenticated
  using (couple_id = public.my_couple_id() and author_id = auth.uid());

grant select, insert, update, delete on public.diaries to authenticated;
grant select, insert, delete on public.diary_comments to authenticated;
