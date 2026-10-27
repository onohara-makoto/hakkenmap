-- users / observations / photos の初期テーブル作成
-- 注: 本番では SQL Editor から直接実行されており、元のマイグレーションSQLは
-- リポジトリに残っていなかったため、本番の現状（2026-10-14 時点）から再構成した。

create table public.users (
  id uuid references auth.users on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz default now(),
  primary key (id)
);

create table public.observations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  category text check (category in ('木', '草', '花', 'きのこ', '虫', 'その他')),
  memo text,
  latitude float8,
  longitude float8,
  location_name text,
  observed_at timestamptz,
  created_at timestamptz default now()
);

create table public.photos (
  id uuid default gen_random_uuid() primary key,
  observation_id uuid references public.observations(id) on delete cascade,
  photo_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);
