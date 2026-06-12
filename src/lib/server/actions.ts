"use server";

// Server-side data access. Every export is a Server Function reachable from the
// client via POST; auth + authorization are enforced here (this replaces the
// Supabase Row-Level-Security policies). The browser never touches Neon directly.
import { headers } from "next/headers";
import { put, del } from "@vercel/blob";
import { sql, currentUserId, currentAuthUser } from "../neon";
import { isAuthConfigured } from "@/lib/auth/server";
import {
  mapTeam,
  mapProfile,
  type Row,
} from "../mappers";
import type { Goal, GoalStatus, GrowthVideo, Match, RequestStatus, Role, Team, UserProfile, VideoComment } from "../types";
import type { Skill } from "../stats";

// ---- helpers -----------------------------------------------------------

const IDENT = /^[a-z_]+$/;
const TEAM_SCOPED = new Set([
  "practices", "tactics", "journals", "requests", "matches", "stats",
  "skill_sheets", "videos", "goals", "nutrition_logs", "gacha_pulls", "profiles",
]);
const READ_TABLES = new Set([...TEAM_SCOPED, "teams"]);
const FILTER_COLS = new Set(["team_id", "match_id", "user_id", "author_id", "id", "invite_code"]);
// Columns that may appear in an `order by` (whitelist; never interpolate raw input).
const ORDER_COLS = new Set(["created_at", "updated_at", "date"]);
// Roles a self-service join is allowed to assign (never "coach").
const JOINABLE_ROLES = new Set<Role>(["player", "manager"]);
// Cap on uploaded video size.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

// Best-effort, per-instance rate limiter. Serverless instances are ephemeral, so
// this throttles bursts (e.g. invite-code brute forcing) rather than guaranteeing
// a global limit; a shared store would be needed for that.
const rateBuckets = new Map<string, number[]>();
function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const hits = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) throw new Error("試行回数が多すぎます。しばらくしてからお試しください。");
  hits.push(now);
  rateBuckets.set(key, hits);
}
async function rateLimitByIp(scope: string, max: number, windowMs: number): Promise<void> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  rateLimit(`${scope}:${ip}`, max, windowMs);
}

async function requireUser(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error("認証が必要です。ログインしてください。");
  return uid;
}

async function profileRow(uid: string): Promise<Row | null> {
  const rows = (await sql.query("select * from profiles where id = $1 limit 1", [uid])) as Row[];
  return rows[0] ?? null;
}

interface Ctx {
  uid: string;
  teamId: string | null;
  role: Role | null;
  name: string;
}
async function ctx(): Promise<Ctx> {
  const uid = await requireUser();
  const p = await profileRow(uid);
  return {
    uid,
    teamId: (p?.team_id as string) ?? null,
    role: (p?.role as Role) ?? null,
    name: (p?.display_name as string) ?? "",
  };
}
function assertTeam(c: Ctx, teamId: string) {
  if (!c.teamId || c.teamId !== teamId) throw new Error("このチームを操作する権限がありません。");
}
function assertCoach(c: Ctx) {
  if (c.role !== "coach") throw new Error("顧問・コーチのみ実行できます。");
}
function assertStaff(c: Ctx) {
  if (c.role !== "coach" && c.role !== "manager") throw new Error("スタッフのみ実行できます。");
}

function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ---- generic reads (consumed by useCollection / useDoc) ----------------

export interface ReadSpec {
  table: string;
  filters: { col: string; val: string | number }[];
  order?: { col: string; ascending: boolean };
  limit?: number;
}

export async function fetchRows(spec: ReadSpec): Promise<Row[]> {
  const c = await ctx();
  if (!READ_TABLES.has(spec.table) || !IDENT.test(spec.table)) {
    throw new Error("不正なテーブル指定です。");
  }
  if (!c.teamId) return [];

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (spec.table === "teams") {
    params.push(c.teamId);
    where.push(`id = $${params.length}`);
  } else {
    params.push(c.teamId);
    where.push(`team_id = $${params.length}`);
  }
  for (const f of spec.filters ?? []) {
    if (!FILTER_COLS.has(f.col) || !IDENT.test(f.col)) continue;
    if (f.col === "team_id") continue;
    if (spec.table === "teams" && f.col === "id") continue;
    params.push(f.val);
    where.push(`${f.col} = $${params.length}`);
  }
  let q = `select * from ${spec.table} where ${where.join(" and ")}`;
  if (spec.order && ORDER_COLS.has(spec.order.col)) {
    q += ` order by ${spec.order.col} ${spec.order.ascending ? "asc" : "desc"}`;
  }
  if (spec.limit && Number.isInteger(spec.limit) && spec.limit > 0) {
    q += ` limit ${spec.limit}`;
  }
  return (await sql.query(q, params)) as Row[];
}

export async function fetchRow(
  table: string,
  idColumn: string,
  id: string,
): Promise<Row | null> {
  const c = await ctx();
  if (!READ_TABLES.has(table) || !IDENT.test(table)) throw new Error("不正なテーブル指定です。");
  if (!FILTER_COLS.has(idColumn) || !IDENT.test(idColumn)) throw new Error("不正なカラム指定です。");
  if (!c.teamId) return null;

  const params: string[] = [id];
  let q = `select * from ${table} where ${idColumn} = $1`;
  if (table === "teams") {
    // A user may only ever read their own team (prevents reading arbitrary teams
    // — and their invite codes — by id).
    params.push(c.teamId);
    q += ` and id = $2`;
  } else {
    params.push(c.teamId);
    q += ` and team_id = $2`;
  }
  q += " limit 1";
  const rows = (await sql.query(q, params)) as Row[];
  return rows[0] ?? null;
}

// ---- profile / team ----------------------------------------------------

/** Whether Neon Auth env vars are present (drives the client-side setup notice). */
export async function getAuthConfigured(): Promise<boolean> {
  return isAuthConfigured;
}

/** Ensure a profiles row exists for the signed-in Neon Auth user; return it mapped. */
export async function getOrCreateProfile(displayName?: string): Promise<UserProfile | null> {
  const user = await currentAuthUser();
  if (!user) return null;
  const existing = await profileRow(user.id);
  if (existing) {
    // Backfill a display name chosen at sign-up if the row was created empty.
    if (displayName && !existing.display_name) {
      await sql.query("update profiles set display_name = $1 where id = $2", [displayName, user.id]);
      existing.display_name = displayName;
    }
    return mapProfile(existing);
  }
  const name = displayName || user.name || user.email?.split("@")[0] || "";
  const rows = (await sql.query(
    `insert into profiles (id, email, display_name, role)
     values ($1, $2, $3, 'player')
     on conflict (id) do update set email = excluded.email
     returning *`,
    [user.id, user.email ?? "", name],
  )) as Row[];
  return mapProfile(rows[0]);
}

export async function loadTeam(teamId: string): Promise<Team | null> {
  const c = await ctx();
  // Only expose the caller's own team.
  if (!c.teamId || c.teamId !== teamId) return null;
  const rows = (await sql.query("select * from teams where id = $1 limit 1", [teamId])) as Row[];
  return rows[0] ? mapTeam(rows[0]) : null;
}

/** Public: resolve a team display name from an invite code (no auth needed). */
export async function getTeamNameByCode(code: string): Promise<string | null> {
  // Throttle invite-code guessing on this unauthenticated endpoint.
  await rateLimitByIp("teamname", 20, 60_000);
  const rows = (await sql.query(
    "select name from teams where invite_code = $1 limit 1",
    [String(code).toUpperCase()],
  )) as Row[];
  return (rows[0]?.name as string) ?? null;
}

export async function getTeamMembers(teamId: string): Promise<UserProfile[]> {
  const c = await ctx();
  assertTeam(c, teamId);
  const rows = (await sql.query("select * from profiles where team_id = $1", [teamId])) as Row[];
  return rows.map(mapProfile);
}

export async function updateProfile(data: {
  displayName?: string;
  jerseyNumber?: number | null;
  position?: string | null;
}): Promise<void> {
  const uid = await requireUser();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (data.displayName !== undefined) {
    params.push(data.displayName);
    sets.push(`display_name = $${params.length}`);
  }
  if (data.jerseyNumber !== undefined) {
    params.push(data.jerseyNumber);
    sets.push(`jersey_number = $${params.length}`);
  }
  if (data.position !== undefined) {
    params.push(data.position);
    sets.push(`position = $${params.length}`);
  }
  if (sets.length === 0) return;
  params.push(uid);
  await sql.query(`update profiles set ${sets.join(", ")} where id = $${params.length}`, params);
}

export async function createTeam(name: string): Promise<string> {
  const uid = await requireUser();
  await getOrCreateProfile();
  const rows = (await sql.query(
    "insert into teams (name, invite_code, created_by) values ($1, $2, $3) returning id",
    [name, randomInviteCode(), uid],
  )) as Row[];
  const id = rows[0].id as string;
  await sql.query("update profiles set team_id = $1, role = 'coach' where id = $2", [id, uid]);
  return id;
}

export async function joinTeamByCode(
  code: string,
  role: Exclude<Role, "coach">,
): Promise<Team> {
  const uid = await requireUser();
  // The `role` arg is client-supplied — never trust it to grant "coach".
  if (!JOINABLE_ROLES.has(role as Role)) throw new Error("不正な役割が指定されました。");
  rateLimit(`join:${uid}`, 10, 60_000);
  await getOrCreateProfile();
  const rows = (await sql.query(
    "select * from teams where invite_code = $1 limit 1",
    [code.toUpperCase()],
  )) as Row[];
  if (!rows[0]) throw new Error("その招待コードのチームが見つかりませんでした。");
  await sql.query("update profiles set team_id = $1, role = $2 where id = $3", [
    rows[0].id,
    role,
    uid,
  ]);
  return mapTeam(rows[0]);
}

export async function updateMember(
  uid: string,
  data: { role?: Role; squad?: "A" | "B" | null },
): Promise<void> {
  const c = await ctx();
  assertCoach(c);
  const tgt = (await sql.query("select team_id from profiles where id = $1", [uid])) as Row[];
  if (!tgt[0] || tgt[0].team_id !== c.teamId) throw new Error("対象のメンバーが見つかりません。");
  const sets: string[] = [];
  const params: (string | null)[] = [];
  if (data.role !== undefined) {
    params.push(data.role);
    sets.push(`role = $${params.length}`);
  }
  if (data.squad !== undefined) {
    params.push(data.squad);
    sets.push(`squad = $${params.length}`);
  }
  if (sets.length === 0) return;
  params.push(uid);
  await sql.query(`update profiles set ${sets.join(", ")} where id = $${params.length}`, params);
}

// ---- practices ---------------------------------------------------------

export async function createPractice(data: {
  teamId: string; date: string; title: string; theme: string; intent: string;
  menu: string; tacticIds: string[]; createdBy: string;
}): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  assertCoach(c);
  const rows = (await sql.query(
    `insert into practices (team_id, date, title, theme, intent, menu, tactic_ids, created_by)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) returning id`,
    [data.teamId, data.date, data.title, data.theme, data.intent, data.menu,
     JSON.stringify(data.tacticIds), c.uid],
  )) as Row[];
  return rows[0].id as string;
}

export async function deletePractice(id: string): Promise<void> {
  const c = await ctx();
  assertCoach(c);
  await sql.query("delete from practices where id = $1 and team_id = $2", [id, c.teamId]);
}

// ---- tactics -----------------------------------------------------------

export async function createTactic(data: {
  teamId: string; title: string; description: string; rotation: number;
  players: unknown[]; keyframes: unknown[]; createdBy: string;
}): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  assertCoach(c);
  const rows = (await sql.query(
    `insert into tactics (team_id, title, description, rotation, players, keyframes, created_by)
     values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) returning id`,
    [data.teamId, data.title, data.description, data.rotation,
     JSON.stringify(data.players), JSON.stringify(data.keyframes), c.uid],
  )) as Row[];
  return rows[0].id as string;
}

export async function updateTactic(
  id: string,
  data: { title?: string; description?: string; rotation?: number; players?: unknown[]; keyframes?: unknown[] },
): Promise<void> {
  const c = await ctx();
  assertCoach(c);
  const sets: string[] = [];
  const params: (string | number)[] = [];
  if (data.title !== undefined) { params.push(data.title); sets.push(`title = $${params.length}`); }
  if (data.description !== undefined) { params.push(data.description); sets.push(`description = $${params.length}`); }
  if (data.rotation !== undefined) { params.push(data.rotation); sets.push(`rotation = $${params.length}`); }
  if (data.players !== undefined) { params.push(JSON.stringify(data.players)); sets.push(`players = $${params.length}::jsonb`); }
  if (data.keyframes !== undefined) { params.push(JSON.stringify(data.keyframes)); sets.push(`keyframes = $${params.length}::jsonb`); }
  if (sets.length === 0) return;
  params.push(id);
  const teamIdx = params.push(c.teamId as string);
  await sql.query(
    `update tactics set ${sets.join(", ")} where id = $${params.length - 1} and team_id = $${teamIdx}`,
    params,
  );
}

export async function deleteTactic(id: string): Promise<void> {
  const c = await ctx();
  assertCoach(c);
  await sql.query("delete from tactics where id = $1 and team_id = $2", [id, c.teamId]);
}

export async function getTactic(id: string): Promise<Row | null> {
  return fetchRow("tactics", "id", id);
}

export async function getTactics(ids: string[]): Promise<Row[]> {
  if (ids.length === 0) return [];
  const c = await ctx();
  if (!c.teamId) return [];
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(",");
  const rows = (await sql.query(
    `select * from tactics where team_id = $1 and id in (${placeholders})`,
    [c.teamId, ...ids],
  )) as Row[];
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is Row => !!r);
}

// ---- journals ----------------------------------------------------------

export async function createJournal(data: {
  teamId: string; practiceId: string | null; practiceTitle: string;
  authorId: string; authorName: string; condition: number; content: string;
}): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  const rows = (await sql.query(
    `insert into journals (team_id, practice_id, practice_title, author_id, author_name, condition, content)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [data.teamId, data.practiceId, data.practiceTitle, c.uid, c.name || data.authorName, data.condition, data.content],
  )) as Row[];
  return rows[0].id as string;
}

export async function deleteJournal(id: string): Promise<void> {
  const c = await ctx();
  await sql.query("delete from journals where id = $1 and author_id = $2", [id, c.uid]);
}

// ---- requests ----------------------------------------------------------

export async function createRequest(data: {
  teamId: string; title: string; description: string;
  category: string; status: string; authorId: string; authorName: string; voters: string[];
}): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  const rows = (await sql.query(
    `insert into requests (team_id, title, description, category, status, author_id, author_name, voters)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) returning id`,
    [data.teamId, data.title, data.description, data.category, data.status, c.uid, c.name || data.authorName, JSON.stringify(data.voters)],
  )) as Row[];
  return rows[0].id as string;
}

export async function toggleVote(id: string, _uid: string, hasVoted: boolean): Promise<void> {
  const c = await ctx();
  const rows = (await sql.query("select voters from requests where id = $1 and team_id = $2", [id, c.teamId])) as Row[];
  if (!rows[0]) throw new Error("リクエストが見つかりません。");
  const current = (rows[0].voters as string[]) ?? [];
  const voters = hasVoted ? current.filter((v) => v !== c.uid) : [...current, c.uid];
  await sql.query("update requests set voters = $1::jsonb where id = $2 and team_id = $3", [
    JSON.stringify(voters), id, c.teamId,
  ]);
}

export async function setRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const c = await ctx();
  await sql.query("update requests set status = $1 where id = $2 and team_id = $3", [status, id, c.teamId]);
}

export async function deleteRequest(id: string): Promise<void> {
  const c = await ctx();
  if (c.role === "coach") {
    await sql.query("delete from requests where id = $1 and team_id = $2", [id, c.teamId]);
  } else {
    await sql.query("delete from requests where id = $1 and team_id = $2 and author_id = $3", [id, c.teamId, c.uid]);
  }
}

// ---- matches & stats ---------------------------------------------------

export async function createMatch(data: {
  teamId: string; opponent: string; date: string; tournament: string;
  status: string; currentSet: number; sets: unknown[]; createdBy: string;
}): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  assertStaff(c);
  const rows = (await sql.query(
    `insert into matches (team_id, opponent, date, tournament, status, current_set, sets, created_by)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) returning id`,
    [data.teamId, data.opponent, data.date, data.tournament, data.status, data.currentSet, JSON.stringify(data.sets), c.uid],
  )) as Row[];
  return rows[0].id as string;
}

export async function updateMatch(
  id: string,
  data: { sets?: Match["sets"]; currentSet?: number; status?: Match["status"] },
): Promise<void> {
  const c = await ctx();
  assertStaff(c);
  const sets: string[] = [];
  const params: (string | number)[] = [];
  if (data.sets !== undefined) { params.push(JSON.stringify(data.sets)); sets.push(`sets = $${params.length}::jsonb`); }
  if (data.currentSet !== undefined) { params.push(data.currentSet); sets.push(`current_set = $${params.length}`); }
  if (data.status !== undefined) { params.push(data.status); sets.push(`status = $${params.length}`); }
  if (sets.length === 0) return;
  params.push(id);
  const teamIdx = params.push(c.teamId as string);
  await sql.query(
    `update matches set ${sets.join(", ")} where id = $${params.length - 1} and team_id = $${teamIdx}`,
    params,
  );
}

export async function deleteMatch(id: string): Promise<void> {
  const c = await ctx();
  assertStaff(c);
  await sql.query("delete from matches where id = $1 and team_id = $2", [id, c.teamId]);
}

export async function recordStat(data: {
  teamId: string; matchId: string; set: number; playerId: string; playerName: string;
  jersey: number | null; skill: Skill; result: string; x?: number | null; y?: number | null;
}): Promise<void> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  assertStaff(c);
  await sql.query(
    `insert into stats (team_id, match_id, set, player_id, player_name, jersey, skill, result, x, y)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [data.teamId, data.matchId, data.set, data.playerId, data.playerName, data.jersey,
     data.skill, data.result, data.x ?? null, data.y ?? null],
  );
}

export async function deleteStat(id: string): Promise<void> {
  const c = await ctx();
  assertStaff(c);
  await sql.query("delete from stats where id = $1 and team_id = $2", [id, c.teamId]);
}

// ---- portfolio: skill sheets ------------------------------------------

export async function setRating(
  userId: string,
  teamId: string,
  side: "self" | "coach",
  skillKey: string,
  value: number,
): Promise<void> {
  const c = await ctx();
  assertTeam(c, teamId);
  if (side === "coach") assertCoach(c);
  else if (userId !== c.uid && c.role !== "coach") throw new Error("権限がありません。");
  const column = side === "self" ? "self" : "coach";
  await sql.query(
    `insert into skill_sheets (user_id, team_id, ${column}, updated_at)
     values ($1, $2, jsonb_build_object($3::text, $4::numeric), now())
     on conflict (user_id) do update
       set ${column} = skill_sheets.${column} || jsonb_build_object($3::text, $4::numeric),
           updated_at = now()`,
    [userId, teamId, skillKey, value],
  );
}

// ---- portfolio: videos (Vercel Blob) ----------------------------------

export async function uploadVideo(
  file: File,
  teamId: string,
  userId: string,
): Promise<{ url: string; path: string }> {
  const c = await ctx();
  assertTeam(c, teamId);
  // Only accept actual video files within a sane size bound; this prevents using
  // the public Blob store to host arbitrary (e.g. HTML) content or to run up cost.
  if (!file.type.startsWith("video/")) throw new Error("動画ファイルのみアップロードできます。");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("ファイルサイズが大きすぎます（最大200MB）。");
  void userId; // path is derived from the session user, not the client arg
  const safe = file.name.replace(/[^\w.-]/g, "_");
  const path = `videos/${teamId}/${c.uid}/${Date.now()}_${safe}`;
  const blob = await put(path, file, {
    access: "public",
    contentType: file.type,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });
  return { url: blob.url, path: blob.url };
}

export async function createVideo(data: Omit<GrowthVideo, "id" | "createdAt">): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  // Bind ownership to the session user rather than trusting client-supplied ids.
  const rows = (await sql.query(
    `insert into videos (team_id, user_id, user_name, title, skill_tag, url, storage_path, comments)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) returning id`,
    [data.teamId, c.uid, c.name || data.userName, data.title, data.skillTag, data.url, data.storagePath, JSON.stringify(data.comments)],
  )) as Row[];
  return rows[0].id as string;
}

export async function addVideoComment(videoId: string, comment: VideoComment): Promise<void> {
  const c = await ctx();
  const rows = (await sql.query("select comments from videos where id = $1 and team_id = $2", [videoId, c.teamId])) as Row[];
  if (!rows[0]) throw new Error("動画が見つかりません。");
  const comments = [...((rows[0].comments as VideoComment[]) ?? []), comment];
  await sql.query("update videos set comments = $1::jsonb where id = $2 and team_id = $3", [
    JSON.stringify(comments), videoId, c.teamId,
  ]);
}

export async function deleteVideo(video: GrowthVideo): Promise<void> {
  const c = await ctx();
  // Authorize and resolve the blob to delete from the stored row — never from the
  // client-supplied object (which could forge the owner or point del() at another
  // team's file).
  const rows = (await sql.query(
    "select user_id, storage_path, url from videos where id = $1 and team_id = $2",
    [video.id, c.teamId],
  )) as Row[];
  const row = rows[0];
  if (!row) throw new Error("動画が見つかりません。");
  if (c.role !== "coach" && row.user_id !== c.uid) throw new Error("権限がありません。");
  await sql.query("delete from videos where id = $1 and team_id = $2", [video.id, c.teamId]);
  const target = (row.storage_path as string) || (row.url as string);
  if (target) {
    try {
      await del(target, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      /* blob may already be gone; ignore */
    }
  }
}

// ---- portfolio: goals --------------------------------------------------

export async function createGoal(data: Omit<Goal, "id" | "createdAt">): Promise<string> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  const rows = (await sql.query(
    `insert into goals (team_id, user_id, user_name, title, metric, practice_ids, due_date, reflection, status)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) returning id`,
    [data.teamId, data.userId, data.userName, data.title, data.metric,
     JSON.stringify(data.practiceIds), data.dueDate, data.reflection, data.status],
  )) as Row[];
  return rows[0].id as string;
}

export async function updateGoal(
  id: string,
  data: { reflection?: string; title?: string; metric?: string; dueDate?: string; practiceIds?: string[] },
): Promise<void> {
  const c = await ctx();
  const sets: string[] = [];
  const params: string[] = [];
  if (data.reflection !== undefined) { params.push(data.reflection); sets.push(`reflection = $${params.length}`); }
  if (data.title !== undefined) { params.push(data.title); sets.push(`title = $${params.length}`); }
  if (data.metric !== undefined) { params.push(data.metric); sets.push(`metric = $${params.length}`); }
  if (data.dueDate !== undefined) { params.push(data.dueDate); sets.push(`due_date = $${params.length}`); }
  if (data.practiceIds !== undefined) { params.push(JSON.stringify(data.practiceIds)); sets.push(`practice_ids = $${params.length}::jsonb`); }
  if (sets.length === 0) return;
  params.push(id);
  const teamIdx = params.push(c.teamId as string);
  await sql.query(
    `update goals set ${sets.join(", ")} where id = $${params.length - 1} and team_id = $${teamIdx}`,
    params,
  );
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const c = await ctx();
  await sql.query("update goals set status = $1 where id = $2 and team_id = $3", [status, id, c.teamId]);
}

export async function deleteGoal(id: string): Promise<void> {
  const c = await ctx();
  await sql.query("delete from goals where id = $1 and team_id = $2", [id, c.teamId]);
}

// ---- nutrition & gacha -------------------------------------------------

export async function createNutritionLog(data: {
  teamId: string; userId: string; userName: string; date: string;
  tags: string[]; power: number; combo: string;
}): Promise<void> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  await sql.query(
    `insert into nutrition_logs (team_id, user_id, user_name, date, tags, power, combo)
     values ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
    [data.teamId, c.uid, c.name || data.userName, data.date, JSON.stringify(data.tags), data.power, data.combo],
  );
}

export async function createGachaPull(data: {
  teamId: string; userId: string; rewardKey: string; rarity: string;
}): Promise<void> {
  const c = await ctx();
  assertTeam(c, data.teamId);
  await sql.query(
    "insert into gacha_pulls (team_id, user_id, reward_key, rarity) values ($1,$2,$3,$4)",
    [data.teamId, c.uid, data.rewardKey, data.rarity],
  );
}
