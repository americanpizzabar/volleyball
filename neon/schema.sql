-- バレー部アプリ: Neon (Postgres) スキーマ
-- 認証は Neon Auth (Stack Auth) が担当するため、ユーザーIDは text 型で保持し、
-- 認可は Server Functions 側（src/lib/server/actions.ts）で行う（RLSは使わない）。
-- 一覧系のカラム（voters / tactic_ids / practice_ids / tags）は jsonb 配列。
--
-- 適用方法: Neon の SQL Editor にこの内容を貼り付けて実行する。

create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- profiles.id は Stack Auth (Neon Auth) のユーザーID。
create table if not exists profiles (
  id text primary key,
  email text,
  display_name text not null default '',
  role text not null default 'player' check (role in ('coach','player','manager')),
  team_id uuid references teams(id) on delete set null,
  jersey_number int,
  position text,
  squad text check (squad in ('A','B')),
  created_at timestamptz not null default now()
);

create table if not exists practices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  date text not null,
  title text not null default '',
  theme text not null default '',
  intent text not null default '',
  menu text not null default '',
  tactic_ids jsonb not null default '[]',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists tactics (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  rotation int not null default 1,
  players jsonb not null default '[]',
  keyframes jsonb not null default '[]',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  practice_id uuid references practices(id) on delete set null,
  practice_title text not null default '',
  author_id text not null,
  author_name text not null default '',
  condition int not null default 3,
  content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  category text not null default 'feature',
  status text not null default 'open',
  author_id text not null,
  author_name text not null default '',
  voters jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  opponent text not null default '',
  date text not null,
  tournament text not null default '',
  status text not null default 'live',
  current_set int not null default 1,
  sets jsonb not null default '[]',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  set int not null default 1,
  player_id text not null,
  player_name text not null default '',
  jersey int,
  skill text not null,
  result text not null,
  x real,
  y real,
  created_at timestamptz not null default now()
);

create table if not exists skill_sheets (
  user_id text primary key,
  team_id uuid not null references teams(id) on delete cascade,
  self jsonb not null default '{}',
  coach jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id text not null,
  user_name text not null default '',
  title text not null default '',
  skill_tag text not null default '',
  url text not null,
  storage_path text not null default '',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id text not null,
  user_name text not null default '',
  title text not null default '',
  metric text not null default '',
  practice_ids jsonb not null default '[]',
  due_date text not null default '',
  reflection text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id text not null,
  user_name text not null default '',
  date text not null,
  tags jsonb not null default '[]',
  power int not null default 0,
  combo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists gacha_pulls (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id text not null,
  reward_key text not null,
  rarity text not null,
  created_at timestamptz not null default now()
);

create index if not exists practices_team_idx on practices (team_id);
create index if not exists tactics_team_idx on tactics (team_id);
create index if not exists journals_team_idx on journals (team_id);
create index if not exists requests_team_idx on requests (team_id);
create index if not exists matches_team_idx on matches (team_id);
create index if not exists stats_match_idx on stats (match_id);
create index if not exists stats_team_idx on stats (team_id);
create index if not exists videos_user_idx on videos (user_id);
create index if not exists goals_user_idx on goals (user_id);
create index if not exists profiles_team_idx on profiles (team_id);
create index if not exists nutrition_logs_team_idx on nutrition_logs (team_id);
create index if not exists nutrition_logs_user_idx on nutrition_logs (user_id);
create index if not exists gacha_pulls_user_idx on gacha_pulls (user_id);
