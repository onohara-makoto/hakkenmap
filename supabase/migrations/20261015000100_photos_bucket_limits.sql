-- photos バケットにサイズと形式の上限を設定する。
-- RLS で「自分のフォルダにしか書けない」は担保済みだが、上限が無いと
-- 自分のフォルダに巨大なファイルや画像以外を置けてしまう。
-- 既存オブジェクトには影響しない（新しいアップロードだけが対象）。

update storage.buckets
set file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'photos';
