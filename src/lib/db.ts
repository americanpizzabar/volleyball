// Supabase data-access layer. Keeps table names + row<->type mapping in one
// place so pages can stay in camelCase while the DB uses snake_case columns.
import { supabase } from "./supabase/client";
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

type Row = Record<string, unknown>;
export type { Row };

const ts = (v: unknown): number | undefined =>
  v ? new Date(v as string).getTime() : undefined;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---- Row mappers -------------------------------------------------------

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
  return {
    table: "skill_sheets",
    filters: [{ col: "team_id", val: teamId }],
    map: mapSkillSheet,
  };
}

// ---- Nutrition quest (マッスル・モンスター・バトル) --------------------

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

export async function createNutritionLog(
  data: Omit<NutritionLog, "id" | "createdAt">,
): Promise<void> {
  const { error } = await supabase.from("nutrition_logs").insert({
    team_id: data.teamId,
    user_id: data.userId,
    user_name: data.userName,
    date: data.date,
    tags: data.tags,
    power: data.power,
    combo: data.combo,
  });
  if (error) throw new Error(error.message);
}

export function nutritionLogsQuery(teamId: string): QuerySpec<NutritionLog> {
  return {
    table: "nutrition_logs",
    filters: [{ col: "team_id", val: teamId }],
    order: { col: "created_at", ascending: false },
    map: mapNutrition,
  };
}

// ---- Gacha -------------------------------------------------------------

export const mapGachaPull = (r: Row): GachaPull => ({
  id: r.id as string,
  teamId: r.team_id as string,
  userId: r.user_id as string,
  rewardKey: r.reward_key as string,
  rarity: r.rarity as string,
  createdAt: ts(r.created_at),
});

export async function createGachaPull(data: {
  teamId: string;
  userId: string;
  rewardKey: string;
  rarity: string;
}): Promise<void> {
  const { error } = await supabase.from("gacha_pulls").insert({
    team_id: data.teamId,
    user_id: data.userId,
    reward_key: data.rewardKey,
    rarity: data.rarity,
  });
  if (error) throw new Error(error.message);
}

export function gachaPullsByUserQuery(userId: string): QuerySpec<GachaPull> {
  return { table: "gacha_pulls", filters: [{ col: "user_id", val: userId }], map: mapGachaPull };
}

// ---- Teams -------------------------------------------------------------

function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createTeam(name: string, uid: string): Promise<string> {
  const team = unwrap(
    await supabase
      .from("teams")
      .insert({ name, invite_code: randomInviteCode(), created_by: uid })
      .select("id")
      .single(),
  ) as { id: string };
  const { error } = await supabase
    .from("profiles")
    .update({ team_id: team.id, role: "coach" satisfies Role })
    .eq("id", uid);
  if (error) throw new Error(error.message);
  return team.id;
}

export async function joinTeamByCode(
  code: string,
  uid: string,
  role: Exclude<Role, "coach">,
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("その招待コードのチームが見つかりませんでした。");
  const upd = await supabase
    .from("profiles")
    .update({ team_id: data.id, role })
    .eq("id", uid);
  if (upd.error) throw new Error(upd.error.message);
  return mapTeam(data);
}

/** 顧問が同一チームのメンバーのロール / A・B 編成を更新する。 */
export async function updateMember(
  uid: string,
  data: { role?: Role; squad?: "A" | "B" | null },
): Promise<void> {
  const patch: Row = {};
  if (data.role !== undefined) patch.role = data.role;
  if (data.squad !== undefined) patch.squad = data.squad;
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) throw new Error(error.message);
}

export async function getTeamMembers(teamId: string): Promise<UserProfile[]> {
  const rows = unwrap(
    await supabase.from("profiles").select("*").eq("team_id", teamId),
  ) as Row[];
  return rows.map(mapProfile);
}

// ---- Practices ---------------------------------------------------------

export async function createPractice(
  data: Omit<Practice, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("practices")
      .insert({
        team_id: data.teamId,
        date: data.date,
        title: data.title,
        theme: data.theme,
        intent: data.intent,
        menu: data.menu,
        tactic_ids: data.tacticIds,
        created_by: data.createdBy,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function deletePractice(id: string): Promise<void> {
  const { error } = await supabase.from("practices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Tactics -----------------------------------------------------------

export async function createTactic(
  data: Omit<Tactic, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("tactics")
      .insert({
        team_id: data.teamId,
        title: data.title,
        description: data.description,
        rotation: data.rotation,
        players: data.players,
        keyframes: data.keyframes,
        created_by: data.createdBy,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function updateTactic(
  id: string,
  data: Partial<Pick<Tactic, "title" | "description" | "rotation" | "players" | "keyframes">>,
): Promise<void> {
  const { error } = await supabase.from("tactics").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTactic(id: string): Promise<void> {
  const { error } = await supabase.from("tactics").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getTactic(id: string): Promise<Tactic | null> {
  const { data, error } = await supabase.from("tactics").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapTactic(data) : null;
}

export async function getTactics(ids: string[]): Promise<Tactic[]> {
  if (ids.length === 0) return [];
  const rows = unwrap(
    await supabase.from("tactics").select("*").in("id", ids),
  ) as Row[];
  const byId = new Map(rows.map((r) => [r.id as string, mapTactic(r)]));
  return ids.map((id) => byId.get(id)).filter((t): t is Tactic => !!t);
}

// ---- Journals ----------------------------------------------------------

export async function createJournal(
  data: Omit<JournalEntry, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("journals")
      .insert({
        team_id: data.teamId,
        practice_id: data.practiceId,
        practice_title: data.practiceTitle,
        author_id: data.authorId,
        author_name: data.authorName,
        condition: data.condition,
        content: data.content,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function deleteJournal(id: string): Promise<void> {
  const { error } = await supabase.from("journals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Requests ----------------------------------------------------------

export async function createRequest(
  data: Omit<FeatureRequest, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("requests")
      .insert({
        team_id: data.teamId,
        title: data.title,
        description: data.description,
        category: data.category,
        status: data.status,
        author_id: data.authorId,
        author_name: data.authorName,
        voters: data.voters,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function toggleVote(
  id: string,
  uid: string,
  hasVoted: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from("requests")
    .select("voters")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  const current = (data.voters as string[]) ?? [];
  const voters = hasVoted ? current.filter((v) => v !== uid) : [...current, uid];
  const upd = await supabase.from("requests").update({ voters }).eq("id", id);
  if (upd.error) throw new Error(upd.error.message);
}

export async function setRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase.from("requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Matches & stats ---------------------------------------------------

export async function createMatch(
  data: Omit<Match, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("matches")
      .insert({
        team_id: data.teamId,
        opponent: data.opponent,
        date: data.date,
        tournament: data.tournament,
        status: data.status,
        current_set: data.currentSet,
        sets: data.sets,
        created_by: data.createdBy,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function updateMatch(
  id: string,
  data: Partial<Pick<Match, "sets" | "currentSet" | "status">>,
): Promise<void> {
  const patch: Row = {};
  if (data.sets !== undefined) patch.sets = data.sets;
  if (data.currentSet !== undefined) patch.current_set = data.currentSet;
  if (data.status !== undefined) patch.status = data.status;
  const { error } = await supabase.from("matches").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function recordStat(data: {
  teamId: string;
  matchId: string;
  set: number;
  playerId: string;
  playerName: string;
  jersey: number | null;
  skill: Skill;
  result: string;
  x?: number | null;
  y?: number | null;
}): Promise<void> {
  const { error } = await supabase.from("stats").insert({
    team_id: data.teamId,
    match_id: data.matchId,
    set: data.set,
    player_id: data.playerId,
    player_name: data.playerName,
    jersey: data.jersey,
    skill: data.skill,
    result: data.result,
    x: data.x ?? null,
    y: data.y ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteStat(id: string): Promise<void> {
  const { error } = await supabase.from("stats").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Portfolio: skill sheets -------------------------------------------

export async function setRating(
  userId: string,
  teamId: string,
  side: "self" | "coach",
  skillKey: string,
  value: number,
): Promise<void> {
  const { data } = await supabase
    .from("skill_sheets")
    .select("self, coach")
    .eq("user_id", userId)
    .maybeSingle();
  const existing = ((data?.[side] as Record<string, number>) ?? {});
  const merged = { ...existing, [skillKey]: value };
  const { error } = await supabase.from("skill_sheets").upsert(
    {
      user_id: userId,
      team_id: teamId,
      [side]: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

// ---- Portfolio: videos -------------------------------------------------

export async function uploadVideo(
  file: File,
  teamId: string,
  userId: string,
): Promise<{ url: string; path: string }> {
  const safe = file.name.replace(/[^\w.-]/g, "_");
  const path = `${teamId}/${userId}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from("videos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("videos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function createVideo(
  data: Omit<GrowthVideo, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("videos")
      .insert({
        team_id: data.teamId,
        user_id: data.userId,
        user_name: data.userName,
        title: data.title,
        skill_tag: data.skillTag,
        url: data.url,
        storage_path: data.storagePath,
        comments: data.comments,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function addVideoComment(
  videoId: string,
  comment: VideoComment,
): Promise<void> {
  const { data, error } = await supabase
    .from("videos")
    .select("comments")
    .eq("id", videoId)
    .single();
  if (error) throw new Error(error.message);
  const comments = [...((data.comments as VideoComment[]) ?? []), comment];
  const upd = await supabase.from("videos").update({ comments }).eq("id", videoId);
  if (upd.error) throw new Error(upd.error.message);
}

export async function deleteVideo(video: GrowthVideo): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", video.id);
  if (error) throw new Error(error.message);
  if (video.storagePath) {
    await supabase.storage.from("videos").remove([video.storagePath]);
  }
}

// ---- Portfolio: goals --------------------------------------------------

export async function createGoal(
  data: Omit<Goal, "id" | "createdAt">,
): Promise<string> {
  const row = unwrap(
    await supabase
      .from("goals")
      .insert({
        team_id: data.teamId,
        user_id: data.userId,
        user_name: data.userName,
        title: data.title,
        metric: data.metric,
        practice_ids: data.practiceIds,
        due_date: data.dueDate,
        reflection: data.reflection,
        status: data.status,
      })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

export async function updateGoal(
  id: string,
  data: Partial<Pick<Goal, "reflection" | "title" | "metric" | "dueDate" | "practiceIds">>,
): Promise<void> {
  const patch: Row = {};
  if (data.reflection !== undefined) patch.reflection = data.reflection;
  if (data.title !== undefined) patch.title = data.title;
  if (data.metric !== undefined) patch.metric = data.metric;
  if (data.dueDate !== undefined) patch.due_date = data.dueDate;
  if (data.practiceIds !== undefined) patch.practice_ids = data.practiceIds;
  const { error } = await supabase.from("goals").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const { error } = await supabase.from("goals").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type { StatEvent };
