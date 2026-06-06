-- バレー部アプリ: 初期スキーマ + RLS + Storage + Realtime
-- このプロジェクトには Supabase MCP 経由で適用済み。新環境では
-- `supabase db push` などで再現できるようにここに保存しています。

create extension if not exists pgcrypto;

-- ===== Tables =====
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  role text not null default 'player' check (role in ('coach','player','manager')),
  team_id uuid references public.teams(id) on delete set null,
  jersey_number int,
  position text,
  created_at timestamptz not null default now()
);

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  date text not null,
  title text not null default '',
  theme text not null default '',
  intent text not null default '',
  menu text not null default '',
  tactic_ids uuid[] not null default '{}',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.tactics (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  rotation int not null default 1,
  players jsonb not null default '[]',
  keyframes jsonb not null default '[]',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.journals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  practice_id uuid references public.practices(id) on delete set null,
  practice_title text not null default '',
  author_id uuid not null,
  author_name text not null default '',
  condition int not null default 3,
  content text not null default '',
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  category text not null default 'feature',
  status text not null default 'open',
  author_id uuid not null,
  author_name text not null default '',
  voters uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent text not null default '',
  date text not null,
  tournament text not null default '',
  status text not null default 'live',
  current_set int not null default 1,
  sets jsonb not null default '[]',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  set int not null default 1,
  player_id uuid not null,
  player_name text not null default '',
  jersey int,
  skill text not null,
  result text not null,
  created_at timestamptz not null default now()
);

create table public.skill_sheets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  self jsonb not null default '{}',
  coach jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  user_name text not null default '',
  title text not null default '',
  skill_tag text not null default '',
  url text not null,
  storage_path text not null default '',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  user_name text not null default '',
  title text not null default '',
  metric text not null default '',
  practice_ids uuid[] not null default '{}',
  due_date text not null default '',
  reflection text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index on public.practices (team_id);
create index on public.tactics (team_id);
create index on public.journals (team_id);
create index on public.requests (team_id);
create index on public.matches (team_id);
create index on public.stats (match_id);
create index on public.stats (team_id);
create index on public.videos (user_id);
create index on public.goals (user_id);
create index on public.profiles (team_id);

-- ===== RLS helpers (SECURITY DEFINER で profiles の再帰を回避) =====
create or replace function public.my_team_id()
returns uuid language sql stable security definer set search_path = public as $$
  select team_id from public.profiles where id = auth.uid()
$$;
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() = 'coach'
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() in ('coach','manager')
$$;

-- ===== RLS =====
alter table public.teams        enable row level security;
alter table public.profiles     enable row level security;
alter table public.practices    enable row level security;
alter table public.tactics      enable row level security;
alter table public.journals     enable row level security;
alter table public.requests     enable row level security;
alter table public.matches      enable row level security;
alter table public.stats        enable row level security;
alter table public.skill_sheets enable row level security;
alter table public.videos       enable row level security;
alter table public.goals        enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or team_id = public.my_team_id());
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "teams_select" on public.teams for select to authenticated using (true);
create policy "teams_insert" on public.teams for insert to authenticated
  with check (created_by = auth.uid());
create policy "teams_update" on public.teams for update to authenticated
  using (id = public.my_team_id() and public.is_coach())
  with check (id = public.my_team_id() and public.is_coach());
create policy "teams_delete" on public.teams for delete to authenticated
  using (id = public.my_team_id() and public.is_coach());

create policy "practices_select" on public.practices for select to authenticated
  using (team_id = public.my_team_id());
create policy "practices_cud" on public.practices for all to authenticated
  using (team_id = public.my_team_id() and public.is_coach())
  with check (team_id = public.my_team_id() and public.is_coach());

create policy "tactics_select" on public.tactics for select to authenticated
  using (team_id = public.my_team_id());
create policy "tactics_cud" on public.tactics for all to authenticated
  using (team_id = public.my_team_id() and public.is_coach())
  with check (team_id = public.my_team_id() and public.is_coach());

create policy "journals_select" on public.journals for select to authenticated
  using (team_id = public.my_team_id());
create policy "journals_insert" on public.journals for insert to authenticated
  with check (team_id = public.my_team_id() and author_id = auth.uid());
create policy "journals_delete" on public.journals for delete to authenticated
  using (author_id = auth.uid());

create policy "requests_select" on public.requests for select to authenticated
  using (team_id = public.my_team_id());
create policy "requests_insert" on public.requests for insert to authenticated
  with check (team_id = public.my_team_id() and author_id = auth.uid());
create policy "requests_update" on public.requests for update to authenticated
  using (team_id = public.my_team_id()) with check (team_id = public.my_team_id());
create policy "requests_delete" on public.requests for delete to authenticated
  using (team_id = public.my_team_id() and (public.is_coach() or author_id = auth.uid()));

create policy "matches_select" on public.matches for select to authenticated
  using (team_id = public.my_team_id());
create policy "matches_cud" on public.matches for all to authenticated
  using (team_id = public.my_team_id() and public.is_staff())
  with check (team_id = public.my_team_id() and public.is_staff());

create policy "stats_select" on public.stats for select to authenticated
  using (team_id = public.my_team_id());
create policy "stats_insert" on public.stats for insert to authenticated
  with check (team_id = public.my_team_id() and public.is_staff());
create policy "stats_delete" on public.stats for delete to authenticated
  using (team_id = public.my_team_id() and public.is_staff());

create policy "skill_sheets_select" on public.skill_sheets for select to authenticated
  using (team_id = public.my_team_id());
create policy "skill_sheets_insert" on public.skill_sheets for insert to authenticated
  with check (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()));
create policy "skill_sheets_update" on public.skill_sheets for update to authenticated
  using (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()))
  with check (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()));

create policy "videos_select" on public.videos for select to authenticated
  using (team_id = public.my_team_id());
create policy "videos_insert" on public.videos for insert to authenticated
  with check (team_id = public.my_team_id() and user_id = auth.uid());
create policy "videos_update" on public.videos for update to authenticated
  using (team_id = public.my_team_id()) with check (team_id = public.my_team_id());
create policy "videos_delete" on public.videos for delete to authenticated
  using (team_id = public.my_team_id() and (public.is_coach() or user_id = auth.uid()));

create policy "goals_select" on public.goals for select to authenticated
  using (team_id = public.my_team_id());
create policy "goals_insert" on public.goals for insert to authenticated
  with check (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()));
create policy "goals_update" on public.goals for update to authenticated
  using (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()))
  with check (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()));
create policy "goals_delete" on public.goals for delete to authenticated
  using (team_id = public.my_team_id() and (user_id = auth.uid() or public.is_coach()));

-- ===== 新規ユーザー登録時に profiles を自動作成 =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name',''), 'player')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ===== Storage: 動画バケット =====
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true) on conflict (id) do nothing;

create policy "videos_obj_select" on storage.objects for select to authenticated
  using (bucket_id = 'videos');
create policy "videos_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "videos_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'videos');

-- ===== Realtime =====
alter publication supabase_realtime add table
  public.profiles, public.teams, public.practices, public.tactics,
  public.journals, public.requests, public.matches, public.stats,
  public.skill_sheets, public.videos, public.goals;
