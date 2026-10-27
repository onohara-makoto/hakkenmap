-- auth.users へのサインアップ時に public.users へプロフィール行を自動作成する
-- 本番の現状（修正前)から再構成（20260610133849_create_initial_tables.sql と同じ注記）。
-- このバージョンは search_path が未固定だったため、
-- 20261014095000_harden_handle_new_user.sql で修正している。

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
