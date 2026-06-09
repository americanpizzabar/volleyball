-- ミラクル・プレイ・ガチャの抽選履歴
create table if not exists public.gacha_pulls (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  reward_key text not null,
  rarity text not null,
  created_at timestamptz not null default now()
);
create index if not exists gacha_pulls_user_idx on public.gacha_pulls (user_id);
alter table public.gacha_pulls enable row level security;
create policy "gacha_select" on public.gacha_pulls for select to authenticated
  using (team_id = public.my_team_id());
create policy "gacha_insert" on public.gacha_pulls for insert to authenticated
  with check (team_id = public.my_team_id() and user_id = auth.uid());
alter publication supabase_realtime add table public.gacha_pulls;
