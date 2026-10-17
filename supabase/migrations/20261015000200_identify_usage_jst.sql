-- AI識別の日次上限を日本時間の日付で数える。
-- current_date は DB のタイムゾーン（UTC）なので、日本の利用者には朝9時にリセットされていた。
-- 関数の中身以外（引数・権限・SECURITY DEFINER）は 20261014094948 と同じ。

create or replace function public.increment_identify_usage(p_user_id uuid, p_daily_limit int)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'forbidden';
  end if;

  insert into public.api_usage_daily (user_id, usage_date, count)
  values (p_user_id, v_today, 1)
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
