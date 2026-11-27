-- QT: 질문 카드 답변, 나눔 글, 나눔 댓글
-- Supabase > SQL Editor 에 전체를 붙여 넣고 Run 을 한 번 누른다.

create table public.qt_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  q_date date not null,
  question text not null check (char_length(question) between 1 and 200),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (user_id, q_date)
);
create table public.qt_shares (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  share_date date not null default current_date,
  book smallint check (book between 1 and 66),
  passage text not null default '' check (char_length(passage) <= 60),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table public.qt_share_comments (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.qt_shares(id) on delete cascade,
  couple_id uuid not null default public.my_couple_id() references public.couples(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index qt_answers_couple on public.qt_answers (couple_id, q_date desc);
create index qt_shares_couple on public.qt_shares (couple_id, share_date desc);
create index qt_share_comments_share on public.qt_share_comments (share_id, created_at);

alter table public.qt_answers enable row level security;
alter table public.qt_shares enable row level security;
alter table public.qt_share_comments enable row level security;

-- 읽기: 우리 커플의 것 전부. 쓰기·고치기·지우기: 자기 것만
create policy "QT 답 읽기" on public.qt_answers for select to authenticated using (couple_id = public.my_couple_id());
create policy "QT 답 쓰기" on public.qt_answers for insert to authenticated with check (couple_id = public.my_couple_id() and user_id = auth.uid());
create policy "내 QT 답 고치기" on public.qt_answers for update to authenticated
  using (user_id = auth.uid()) with check (couple_id = public.my_couple_id() and user_id = auth.uid());

create policy "나눔 읽기" on public.qt_shares for select to authenticated using (couple_id = public.my_couple_id());
create policy "나눔 쓰기" on public.qt_shares for insert to authenticated with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 나눔 고치기" on public.qt_shares for update to authenticated
  using (couple_id = public.my_couple_id() and author_id = auth.uid()) with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 나눔 지우기" on public.qt_shares for delete to authenticated using (couple_id = public.my_couple_id() and author_id = auth.uid());

create policy "나눔 댓글 읽기" on public.qt_share_comments for select to authenticated using (couple_id = public.my_couple_id());
create policy "나눔 댓글 쓰기" on public.qt_share_comments for insert to authenticated with check (couple_id = public.my_couple_id() and author_id = auth.uid());
create policy "내 나눔 댓글 지우기" on public.qt_share_comments for delete to authenticated using (couple_id = public.my_couple_id() and author_id = auth.uid());

grant select, insert, update on public.qt_answers to authenticated;
grant select, insert, update, delete on public.qt_shares to authenticated;
grant select, insert, delete on public.qt_share_comments to authenticated;
