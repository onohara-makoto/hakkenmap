-- セキュリティアドバイザリ対応:
-- handle_new_user() の search_path が未固定だった（function_search_path_mutable）ため固定し、
-- anon/authenticated から直接 RPC 経由で呼べる状態
-- （anon_security_definer_function_executable / authenticated_security_definer_function_executable）
-- だったのを塞ぐ。この関数は auth.users への INSERT トリガーからのみ呼ばれるべきで、
-- 公開APIとして叩かれる必要はない（トリガー実行はEXECUTE権限の有無に関係なく行われる）。

alter function public.handle_new_user() set search_path = public, pg_temp;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
