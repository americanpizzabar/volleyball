-- A/Bチーム編成用の squad 列＋顧問がメンバーを編集できるRLS
alter table public.profiles add column if not exists squad text check (squad in ('A','B'));

drop policy if exists "profiles_coach_update" on public.profiles;
create policy "profiles_coach_update" on public.profiles for update to authenticated
  using (team_id = public.my_team_id() and public.is_coach())
  with check (team_id = public.my_team_id() and public.is_coach());
