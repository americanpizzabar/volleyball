// Pure snake_case row -> camelCase type mappers.
// Shared by the client data layer (db.ts) and the server actions (server/actions.ts),
// so it must stay free of any "use client" / "use server" / driver imports.
import type {
  FeatureRequest,
  GachaPull,
  Goal,
  GoalStatus,
  GrowthVideo,
  JournalEntry,
  Match,
  NutritionLog,
  Practice,
  RequestStatus,
  Role,
  SkillSheet,
  Tactic,
  Team,
  UserProfile,
  VideoComment,
} from "./types";
import type { Skill, StatEvent } from "./stats";

export type Row = Record<string, unknown>;

export const ts = (v: unknown): number | undefined =>
  v ? new Date(v as string).getTime() : undefined;

export const mapTeam = (r: Row): Team => ({
  id: r.id as string,
  name: r.name as string,
  inviteCode: r.invite_code as string,
  createdBy: r.created_by as string,
  createdAt: ts(r.created_at),
});

export const mapProfile = (r: Row): UserProfile => ({
  uid: r.id as string,
  email: (r.email as string) ?? "",
  displayName: (r.display_name as string) ?? "",
  role: r.role as Role,
  teamId: (r.team_id as string) ?? null,
  jerseyNumber: (r.jersey_number as number) ?? null,
  position: (r.position as UserProfile["position"]) ?? null,
  squad: (r.squad as UserProfile["squad"]) ?? null,
  createdAt: ts(r.created_at),
});

export const mapPractice = (r: Row): Practice => ({
  id: r.id as string,
  teamId: r.team_id as string,
  date: r.date as string,
  title: r.title as string,
  theme: r.theme as string,
  intent: r.intent as string,
  menu: r.menu as string,
  tacticIds: (r.tactic_ids as string[]) ?? [],
  createdBy: r.created_by as string,
  createdAt: ts(r.created_at),
});

export const mapTactic = (r: Row): Tactic => ({
  id: r.id as string,
  teamId: r.team_id as string,
  title: r.title as string,
  description: r.description as string,
  rotation: r.rotation as number,
  players: (r.players as Tactic["players"]) ?? [],
  keyframes: (r.keyframes as Tactic["keyframes"]) ?? [],
  createdBy: r.created_by as string,
  createdAt: ts(r.created_at),
});

export const mapJournal = (r: Row): JournalEntry => ({
  id: r.id as string,
  teamId: r.team_id as string,
  practiceId: (r.practice_id as string) ?? null,
  practiceTitle: r.practice_title as string,
  authorId: r.author_id as string,
  authorName: r.author_name as string,
  condition: r.condition as number,
  content: r.content as string,
  createdAt: ts(r.created_at),
});

export const mapRequest = (r: Row): FeatureRequest => ({
  id: r.id as string,
  teamId: r.team_id as string,
  title: r.title as string,
  description: r.description as string,
  category: r.category as FeatureRequest["category"],
  status: r.status as RequestStatus,
  authorId: r.author_id as string,
  authorName: r.author_name as string,
  voters: (r.voters as string[]) ?? [],
  createdAt: ts(r.created_at),
});

export const mapMatch = (r: Row): Match => ({
  id: r.id as string,
  teamId: r.team_id as string,
  opponent: r.opponent as string,
  date: r.date as string,
  tournament: r.tournament as string,
  status: r.status as Match["status"],
  currentSet: r.current_set as number,
  sets: (r.sets as Match["sets"]) ?? [],
  createdBy: r.created_by as string,
  createdAt: ts(r.created_at),
});

export const mapStat = (r: Row): StatEvent => ({
  id: r.id as string,
  teamId: r.team_id as string,
  matchId: r.match_id as string,
  set: r.set as number,
  playerId: r.player_id as string,
  playerName: r.player_name as string,
  jersey: (r.jersey as number) ?? null,
  skill: r.skill as Skill,
  result: r.result as string,
  x: (r.x as number) ?? null,
  y: (r.y as number) ?? null,
  createdAt: ts(r.created_at),
});

export const mapSkillSheet = (r: Row): SkillSheet => ({
  id: r.user_id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  self: (r.self as Record<string, number>) ?? {},
  coach: (r.coach as Record<string, number>) ?? {},
  updatedAt: ts(r.updated_at),
});

export const mapVideo = (r: Row): GrowthVideo => ({
  id: r.id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  userName: r.user_name as string,
  title: r.title as string,
  skillTag: r.skill_tag as string,
  url: r.url as string,
  storagePath: r.storage_path as string,
  comments: (r.comments as VideoComment[]) ?? [],
  createdAt: ts(r.created_at),
});

export const mapGoal = (r: Row): Goal => ({
  id: r.id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  userName: r.user_name as string,
  title: r.title as string,
  metric: r.metric as string,
  practiceIds: (r.practice_ids as string[]) ?? [],
  dueDate: r.due_date as string,
  reflection: r.reflection as string,
  status: r.status as GoalStatus,
  createdAt: ts(r.created_at),
});

export const mapNutrition = (r: Row): NutritionLog => ({
  id: r.id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  userName: r.user_name as string,
  date: r.date as string,
  tags: (r.tags as string[]) ?? [],
  power: (r.power as number) ?? 0,
  combo: (r.combo as string) ?? "",
  createdAt: ts(r.created_at),
});

export const mapGachaPull = (r: Row): GachaPull => ({
  id: r.id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  rewardKey: r.reward_key as string,
  rarity: r.rarity as string,
  createdAt: ts(r.created_at),
});
