-- /api/identify（Gemini AI識別）のユーザー別・日次利用回数を記録するテーブルと、
-- アトミックにカウントアップしつつ上限超過時は例外で失敗させる RPC 関数。
--
-- increment_identify_usage は SECURITY DEFINER だが、以下の理由で安全:
--   - p_user_id は呼び出し元の auth.uid() と一致しない限り 'forbidden' で失敗する
--     （他人の利用枠を消費させたり覗いたりできない）
--   - 上限超過時は例外を投げ、関数内のINSERT/UPDATEも含めてロールバックされる
--     （カウントが上限を超えて記録され続けることはない）
-- anon ロールの実行権限は明示的に revoke し、authenticated のみ許可している。

create table public.api_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.api_usage_daily enable row level security;

create policy "自分の利用状況のみ閲覧" on public.api_usage_daily
  for select using (auth.uid() = user_id);

create or replace function public.increment_identify_usage(p_user_id uuid, p_daily_limit int)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'forbidden';
  end if;

  insert into public.api_usage_daily (user_id, usage_date, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set count = api_usage_daily.count + 1, updated_at = now()
  returning count into v_count;

  if v_count > p_daily_limit then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;

  return v_count;
end;
$$;

revoke all on function public.increment_identify_usage(uuid, int) from public, anon;
grant execute on function public.increment_identify_usage(uuid, int) to authenticated;
