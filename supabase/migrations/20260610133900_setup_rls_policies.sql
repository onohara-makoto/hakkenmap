-- users / observations / photos の RLS 有効化とポリシー設定
-- 本番の現状から再構成（20260610133849_create_initial_tables.sql と同じ注記）。

alter table public.users enable row level security;
alter table public.observations enable row level security;
alter table public.photos enable row level security;

-- observations: 自分の投稿のみ操作できる
create policy "自分の投稿のみ閲覧" on public.observations
  for select using (auth.uid() = user_id);
create policy "自分の投稿のみ作成" on public.observations
  for insert with check (auth.uid() = user_id);
create policy "自分の投稿のみ更新" on public.observations
  for update using (auth.uid() = user_id);
create policy "自分の投稿のみ削除" on public.observations
  for delete using (auth.uid() = user_id);

-- users: プロフィールは全員閲覧可、作成・更新は自分のみ
create policy "プロフィールは誰でも閲覧可" on public.users
  for select using (true);
create policy "自分のプロフィールのみ作成" on public.users
  for insert with check (auth.uid() = id);
create policy "自分のプロフィールのみ更新" on public.users
  for update using (auth.uid() = id);

-- photos: 紐づく observation の所有者のみ操作できる
create policy "自分の写真のみ閲覧" on public.photos
  for select using (
    exists (
      select 1 from public.observations
      where observations.id = photos.observation_id
        and observations.user_id = auth.uid()
    )
  );
create policy "自分の写真のみ作成" on public.photos
  for insert with check (
    exists (
      select 1 from public.observations
      where observations.id = photos.observation_id
        and observations.user_id = auth.uid()
    )
  );
create policy "自分の写真のみ削除" on public.photos
  for delete using (
    exists (
      select 1 from public.observations
      where observations.id = photos.observation_id
        and observations.user_id = auth.uid()
    )
  );
