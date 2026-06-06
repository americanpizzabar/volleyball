-- 招待コードからチーム名だけを返す（未ログインの参加ページ表示用）。
create or replace function public.team_name_for_code(code text)
returns text language sql stable security definer set search_path = public as $$
  select name from public.teams where invite_code = upper(code) limit 1
$$;
revoke execute on function public.team_name_for_code(text) from public;
grant execute on function public.team_name_for_code(text) to anon, authenticated;
