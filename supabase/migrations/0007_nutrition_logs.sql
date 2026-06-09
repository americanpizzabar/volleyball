-- 栄養クエスト『マッスル・モンスター・バトル』用の食事ログ
create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  user_name text not null default '',
  date text not null,
  tags text[] not null default '{}',
  power int not null default 0,
  combo text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists nutrition_logs_team_idx on public.nutrition_logs (team_id);
create index if not exists nutrition_logs_user_idx on public.nutrition_logs (user_id);
alter table public.nutrition_logs enable row level security;
create policy "nutrition_select" on public.nutrition_logs for select to authenticated
  using (team_id = public.my_team_id());
create policy "nutrition_insert" on public.nutrition_logs for insert to authenticated
  with check (team_id = public.my_team_id() and user_id = auth.uid());
create policy "nutrition_delete" on public.nutrition_logs for delete to authenticated
  using (user_id = auth.uid());
alter publication supabase_realtime add table public.nutrition_logs;
