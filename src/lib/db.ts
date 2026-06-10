// Client-facing data layer. Query specs (consumed by useCollection/useDoc) and
// row<->type mappers live here; all reads and writes run on the server via the
// Server Functions in ./server/actions (which enforce auth + team scoping).
import {
  mapGachaPull, mapGoal, mapJournal, mapMatch, mapNutrition, mapPractice,
  mapProfile, mapRequest, mapSkillSheet, mapStat, mapTactic, mapTeam, mapVideo,
  type Row,
} from "./mappers";
import * as server from "./server/actions";
import type {
  FeatureRequest, GachaPull, Goal, GrowthVideo, JournalEntry, Match,
  NutritionLog, Practice, Role, SkillSheet, Tactic, Team,
} from "./types";
import type { StatEvent } from "./stats";

export type { Row, StatEvent };
export {
  mapGachaPull, mapGoal, mapJournal, mapMatch, mapNutrition, mapPractice,
  mapProfile, mapRequest, mapSkillSheet, mapStat, mapTactic, mapTeam, mapVideo,
};

// ---- Query specs (consumed by useCollection) ---------------------------

export interface QuerySpec<T> {
  table: string;
  filters: { col: string; val: string | number }[];
  order?: { col: string; ascending: boolean };
  limit?: number;
  map: (row: Row) => T;
}

export function practicesQuery(teamId: string, limitN?: number): QuerySpec<Practice> {
  return {
    table: "practices",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "date", ascending: false },
    limit: limitN,
    map: mapPractice,
  };
}
export function tacticsQuery(teamId: string): QuerySpec<Tactic> {
  return {
    table: "tactics",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "created_at", ascending: false },
    map: mapTactic,
  };
}
export function journalsQuery(teamId: string): QuerySpec<JournalEntry> {
  return {
    table: "journals",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "created_at", ascending: false },
    map: mapJournal,
  };
}
export function requestsQuery(teamId: string): QuerySpec<FeatureRequest> {
  return {
    table: "requests",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "created_at", ascending: false },
    map: mapRequest,
  };
}
export function matchesQuery(teamId: string): QuerySpec<Match> {
  return {
    table: "matches",
    filters: [{ col: "team_id", val: teamId }],
    map: mapMatch,
  };
}
export function matchStatsQuery(matchId: string): QuerySpec<StatEvent> {
  return { table: "stats", filters: [{ col: "match_id", val: matchId }], map: mapStat };
}
export function teamStatsQuery(teamId: string): QuerySpec<StatEvent> {
  return { table: "stats", filters: [{ col: "team_id", val: teamId }], map: mapStat };
}
export function videosByUserQuery(userId: string): QuerySpec<GrowthVideo> {
  return { table: "videos", filters: [{ col: "user_id", val: userId }], map: mapVideo };
}
export function goalsByUserQuery(userId: string): QuerySpec<Goal> {
  return { table: "goals", filters: [{ col: "user_id", val: userId }], map: mapGoal };
}
export function skillSheetsByTeamQuery(teamId: string): QuerySpec<SkillSheet> {
  return { table: "skill_sheets", filters: [{ col: "team_id", val: teamId }], map: mapSkillSheet };
}
export function nutritionLogsQuery(teamId: string): QuerySpec<NutritionLog> {
  return {
    table: "nutrition_logs",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "created_at", ascending: false },
    map: mapNutrition,
  };
}
export function gachaPullsByUserQuery(userId: string): QuerySpec<GachaPull> {
  return { table: "gacha_pulls", filters: [{ col: "user_id", val: userId }], map: mapGachaPull };
}

// ---- Writes / single reads (Server Functions) --------------------------

// Pass-through Server Functions (auth + team scoping enforced server-side).
export {
  updateMember, updateProfile, getTeamNameByCode, getTeamMembers,
  createPractice, deletePractice,
  createTactic, updateTactic, deleteTactic,
  createJournal, deleteJournal,
  createRequest, toggleVote, setRequestStatus, deleteRequest,
  createMatch, updateMatch, deleteMatch, recordStat, deleteStat,
  setRating, uploadVideo, createVideo, addVideoComment, deleteVideo,
  createGoal, updateGoal, setGoalStatus, deleteGoal,
  createNutritionLog, createGachaPull,
} from "./server/actions";

// Wrappers that adapt the legacy call signatures / map rows to types.
export async function createTeam(name: string, _uid?: string): Promise<string> {
  return server.createTeam(name);
}
export async function joinTeamByCode(
  code: string,
  _uid: string,
  role: Exclude<Role, "coach">,
): Promise<Team> {
  return server.joinTeamByCode(code, role);
}
export async function getTactic(id: string): Promise<Tactic | null> {
  const r = await server.getTactic(id);
  return r ? mapTactic(r) : null;
}
export async function getTactics(ids: string[]): Promise<Tactic[]> {
  const rows = await server.getTactics(ids);
  return rows.map(mapTactic);
}
