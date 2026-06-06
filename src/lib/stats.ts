// Volleyball stat taxonomy + aggregation (機能② スタッツ・クイック).
//
// Recording is "3 taps": player → skill → result. Each tap produces one
// StatEvent. Aggregation turns a list of events into per-player and team
// numbers (決定率, 効果率, 返球率 …) for the between-set meeting and the
// cumulative leaderboard.

export type Skill = "spike" | "serve" | "block" | "reception" | "dig" | "set";

export const SKILLS: { key: Skill; label: string; emoji: string }[] = [
  { key: "spike", label: "スパイク", emoji: "🏐" },
  { key: "serve", label: "サーブ", emoji: "🎯" },
  { key: "reception", label: "レセプション", emoji: "🤲" },
  { key: "block", label: "ブロック", emoji: "🧱" },
  { key: "dig", label: "ディグ", emoji: "🤿" },
  { key: "set", label: "トス", emoji: "✋" },
];

export const SKILL_LABELS: Record<Skill, string> = Object.fromEntries(
  SKILLS.map((s) => [s.key, s.label]),
) as Record<Skill, string>;

/** Each result has a tone so the recorder can colour-code the buttons. */
export type Tone = "good" | "neutral" | "bad";

export interface ResultDef {
  key: string;
  label: string;
  tone: Tone;
  /** +1 our point / -1 our point (失点) / 0 rally continues. */
  point: 0 | 1 | -1;
}

export const RESULTS: Record<Skill, ResultDef[]> = {
  spike: [
    { key: "kill", label: "決定", tone: "good", point: 1 },
    { key: "continue", label: "継続", tone: "neutral", point: 0 },
    { key: "blocked", label: "被ブロック", tone: "bad", point: -1 },
    { key: "error", label: "ミス", tone: "bad", point: -1 },
  ],
  serve: [
    { key: "ace", label: "エース", tone: "good", point: 1 },
    { key: "in", label: "入った", tone: "neutral", point: 0 },
    { key: "error", label: "ミス", tone: "bad", point: -1 },
  ],
  block: [
    { key: "kill", label: "決定", tone: "good", point: 1 },
    { key: "touch", label: "ワンタッチ", tone: "neutral", point: 0 },
    { key: "error", label: "ミス", tone: "bad", point: -1 },
  ],
  reception: [
    { key: "a", label: "A (好返球)", tone: "good", point: 0 },
    { key: "b", label: "B (返球)", tone: "neutral", point: 0 },
    { key: "c", label: "C (乱れ)", tone: "neutral", point: 0 },
    { key: "error", label: "崩れ/失点", tone: "bad", point: -1 },
  ],
  dig: [
    { key: "up", label: "成功", tone: "good", point: 0 },
    { key: "error", label: "失敗", tone: "bad", point: -1 },
  ],
  set: [
    { key: "assist", label: "アシスト", tone: "good", point: 0 },
    { key: "error", label: "ミス", tone: "bad", point: -1 },
  ],
};

export function resultLabel(skill: Skill, result: string): string {
  return RESULTS[skill].find((r) => r.key === result)?.label ?? result;
}

export interface StatEvent {
  id: string;
  teamId: string;
  matchId: string;
  set: number;
  playerId: string;
  playerName: string;
  jersey: number | null;
  skill: Skill;
  result: string;
  /** Landing spot (0-100) for court-tap entries. Null for button entries. */
  x?: number | null;
  y?: number | null;
  createdAt?: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  jersey: number | null;
  spike: { total: number; kill: number; error: number; blocked: number };
  serve: { total: number; ace: number; error: number };
  block: { kill: number; touch: number };
  reception: { total: number; a: number; b: number; c: number; error: number };
  dig: { up: number; error: number };
  set: { assist: number };
}

function emptyPlayer(e: StatEvent): PlayerStats {
  return {
    playerId: e.playerId,
    playerName: e.playerName,
    jersey: e.jersey,
    spike: { total: 0, kill: 0, error: 0, blocked: 0 },
    serve: { total: 0, ace: 0, error: 0 },
    block: { kill: 0, touch: 0 },
    reception: { total: 0, a: 0, b: 0, c: 0, error: 0 },
    dig: { up: 0, error: 0 },
    set: { assist: 0 },
  };
}

/** Group raw events into per-player aggregates. */
export function aggregate(events: StatEvent[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>();
  for (const e of events) {
    if (!map.has(e.playerId)) map.set(e.playerId, emptyPlayer(e));
    const p = map.get(e.playerId)!;
    switch (e.skill) {
      case "spike":
        p.spike.total++;
        if (e.result === "kill") p.spike.kill++;
        else if (e.result === "error") p.spike.error++;
        else if (e.result === "blocked") p.spike.blocked++;
        break;
      case "serve":
        p.serve.total++;
        if (e.result === "ace") p.serve.ace++;
        else if (e.result === "error") p.serve.error++;
        break;
      case "block":
        if (e.result === "kill") p.block.kill++;
        else if (e.result === "touch") p.block.touch++;
        break;
      case "reception":
        p.reception.total++;
        if (e.result === "a") p.reception.a++;
        else if (e.result === "b") p.reception.b++;
        else if (e.result === "c") p.reception.c++;
        else if (e.result === "error") p.reception.error++;
        break;
      case "dig":
        if (e.result === "up") p.dig.up++;
        else p.dig.error++;
        break;
      case "set":
        if (e.result === "assist") p.set.assist++;
        break;
    }
  }
  return [...map.values()];
}

/** スパイク決定率 (%) = 決定 / 打数. */
export function killRate(p: PlayerStats): number | null {
  return p.spike.total ? (p.spike.kill / p.spike.total) * 100 : null;
}

/** スパイク効果率 (%) = (決定 - ミス - 被ブロック) / 打数. */
export function attackEfficiency(p: PlayerStats): number | null {
  if (!p.spike.total) return null;
  return ((p.spike.kill - p.spike.error - p.spike.blocked) / p.spike.total) * 100;
}

/** サーブレシーブ返球率 (%) = (A+B+C) / 本数. */
export function receptionRate(p: PlayerStats): number | null {
  if (!p.reception.total) return null;
  return (
    ((p.reception.a + p.reception.b + p.reception.c) / p.reception.total) * 100
  );
}

/** レセプションA率 (%). */
export function receptionARate(p: PlayerStats): number | null {
  return p.reception.total ? (p.reception.a / p.reception.total) * 100 : null;
}

export function fmtPct(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}
