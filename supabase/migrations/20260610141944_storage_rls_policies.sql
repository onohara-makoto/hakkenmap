-- Storage バケット「photos」の作成とアクセス制御
-- 本番の現状から再構成（20260610133849_create_initial_tables.sql と同じ注記）。
-- パス規約: `${auth.uid()}/${ファイル名}` に保存することで、先頭フォルダ名が
-- そのまま所有者判定に使える（storage.foldername(name)[1]）。

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "Users can upload their own photos" on storage.objects
  for insert with check (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own photos" on storage.objects
  for select using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own photos" on storage.objects
  for delete using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
