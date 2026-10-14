-- observations に photo_url 列を追加（1投稿1枚の写真URLを直接保持）
-- 本番の現状から再構成（20260610133849_create_initial_tables.sql と同じ注記）。

alter table public.observations add column photo_url text;
