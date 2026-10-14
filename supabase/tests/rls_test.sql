-- ユーザー間のアクセス分離（RLS）テスト。
-- ユーザーA・Bを作り、B が A の記録・写真を閲覧・変更・削除できないこと、
-- A 自身は自分のデータを扱えることを確認する。
--
-- すべて1つのトランザクション内で行い、最後に ROLLBACK するのでデータは残らない。
-- 失敗すると例外（'RLS FAIL: ...'）で止まる。
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
--
-- 本番で確認するときは、DO ブロックの末尾の `raise notice` を `raise exception 'RLS OK'`
-- に置き換えて実行すれば、確実にロールバックされる（docs/security.md 参照）。

begin;

do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  obs_a uuid := '00000000-0000-4000-8000-0000000000a1';
  obs_b uuid := '00000000-0000-4000-8000-0000000000b1';
  n int;
  denied boolean;
begin
  -- テストユーザー（handle_new_user トリガーで public.users も作られる）
  insert into auth.users (id, email, aud, role) values
    (a, 'rls-test-a@example.invalid', 'authenticated', 'authenticated'),
    (b, 'rls-test-b@example.invalid', 'authenticated', 'authenticated');

  -- ---------- ユーザーA ----------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  insert into public.observations (id, user_id, category, memo)
    values (obs_a, a, '花', 'A の記録');
  insert into storage.objects (bucket_id, name)
    values ('photos', a || '/' || obs_a || '.jpg');

  select count(*) into n from public.observations where id = obs_a;
  if n <> 1 then raise exception 'RLS FAIL: A cannot read own observation'; end if;
  select count(*) into n from storage.objects where bucket_id = 'photos' and name like a || '/%';
  if n <> 1 then raise exception 'RLS FAIL: A cannot read own photo object'; end if;

  -- A は他人名義の記録・他人フォルダへの写真を作れない
  denied := false;
  begin
    insert into public.observations (user_id, category, memo) values (b, '花', 'なりすまし');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'RLS FAIL: A inserted an observation as B'; end if;

  denied := false;
  begin
    insert into storage.objects (bucket_id, name) values ('photos', b || '/x.jpg');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'RLS FAIL: A uploaded into B''s folder'; end if;

  -- ---------- ユーザーB ----------
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  insert into public.observations (id, user_id, category, memo) values (obs_b, b, '虫', 'B の記録');

  select count(*) into n from public.observations where id = obs_a;
  if n <> 0 then raise exception 'RLS FAIL: B can read A''s observation'; end if;
  select count(*) into n from public.observations;
  if n <> 1 then raise exception 'RLS FAIL: B sees % observations (expected only own 1)', n; end if;

  update public.observations set memo = 'hacked' where id = obs_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS FAIL: B updated A''s observation'; end if;

  delete from public.observations where id = obs_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS FAIL: B deleted A''s observation'; end if;

  -- 自分の記録を A 名義に付け替えることもできない
  denied := false;
  begin
    update public.observations set user_id = a where id = obs_b;
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'RLS FAIL: B reassigned an observation to A'; end if;

  select count(*) into n from storage.objects where bucket_id = 'photos' and name like a || '/%';
  if n <> 0 then raise exception 'RLS FAIL: B can list A''s photos'; end if;

  delete from storage.objects where bucket_id = 'photos' and name like a || '/%';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS FAIL: B deleted A''s photo'; end if;

  select count(*) into n from public.api_usage_daily where user_id = a;
  if n <> 0 then raise exception 'RLS FAIL: B can read A''s usage'; end if;

  -- B は A の利用枠を消費できない
  denied := false;
  begin
    perform public.increment_identify_usage(a, 20);
  exception when others then denied := sqlerrm = 'forbidden';
  end;
  if not denied then raise exception 'RLS FAIL: B consumed A''s identify quota'; end if;

  -- ---------- 未ログイン（anon） ----------
  set local role anon;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  -- 権限自体が無い（permission denied）場合も「読めない」ので合格とする
  begin
    select count(*) into n from public.observations;
  exception when insufficient_privilege then n := 0;
  end;
  if n <> 0 then raise exception 'RLS FAIL: anon can read observations'; end if;
  begin
    select count(*) into n from storage.objects where bucket_id = 'photos';
  exception when insufficient_privilege then n := 0;
  end;
  if n <> 0 then raise exception 'RLS FAIL: anon can read photo objects'; end if;

  -- ---------- A から見て、自分のデータは無事 ----------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.observations where id = obs_a and memo = 'A の記録';
  if n <> 1 then raise exception 'RLS FAIL: A''s observation was modified'; end if;

  reset role;
  raise notice 'RLS OK: all access-isolation checks passed';
end
$$;

rollback;
