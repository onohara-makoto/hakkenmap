-- 写真URLの期限対策。
-- これまでは 365日有効の署名付きURLを observations.photo_url に固定保存していたため、
-- 1年後に写真が表示できなくなる。Storage のオブジェクトパスを保存し、表示のたびに
-- 署名付きURLを発行する方式に切り替える（app/lib/storage.ts の withSignedPhotoUrls）。
--
-- 安全性:
--   - 列の追加と値の補完のみで、既存の photo_url は消さない（ロールバック可能）
--   - アプリは photo_path が空でも photo_url からパスを復元するので、
--     このマイグレーションの前後どちらでも既存記録の表示は壊れない
--   - ただし新しいアプリは保存時に photo_path を書くため、**アプリのデプロイより先に適用する**

alter table public.observations add column if not exists photo_path text;

comment on column public.observations.photo_path is
  'photos バケット内のオブジェクトパス（<user_id>/<file>）。表示用の署名URLは取得時に発行する';
comment on column public.observations.photo_url is
  '旧方式の365日署名URL（移行前の記録のみ）。新規記録では null';

-- 既存記録: 署名URLの /object/sign/photos/<path>?token=... からパスを取り出す
update public.observations
set photo_path = substring(photo_url from '/object/sign/photos/([^?#]+)')
where photo_path is null
  and photo_url like '%/object/sign/photos/%';
