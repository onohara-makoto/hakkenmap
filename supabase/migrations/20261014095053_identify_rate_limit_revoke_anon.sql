-- 20261014094948 の補足: anon からの EXECUTE を明示的に剥奪する（本番適用済み）
revoke execute on function public.increment_identify_usage(uuid, int) from anon;
