// 記録済みスタッツから「プレーカード（トレカ）」を生成する。
import type { StatEvent } from "./stats";

export type Rarity = "N" | "R" | "SR" | "UR";

export interface PlayCard {
  id: string;
  rarity: Rarity;
  title: string;
  emoji: string;
  playerName: string;
  jersey: number | null;
  at: number;
}

export const RARITY_STYLE: Record<Rarity, { ring: string; bg: string; label: string }> = {
  N: { ring: "ring-slate-300", bg: "from-slate-100 to-slate-200", label: "N" },
  R: { ring: "ring-blue-300", bg: "from-blue-100 to-blue-200", label: "R" },
  SR: { ring: "ring-purple-300", bg: "from-purple-100 to-fuchsia-200", label: "SR" },
  UR: { ring: "ring-amber-300", bg: "from-amber-100 via-yellow-100 to-orange-200", label: "UR" },
};

// id から安定した 0..1 の値（UR抽選などに使用）
function hash01(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

const NOTABLE: Record<string, { result: string; title: string; emoji: string; base: Rarity }[]> = {
  spike: [{ result: "kill", title: "スパイク決定", emoji: "🏐", base: "R" }],
  serve: [{ result: "ace", title: "サービスエース", emoji: "🎯", base: "SR" }],
  block: [{ result: "kill", title: "シャットアウト", emoji: "🧱", base: "SR" }],
  reception: [{ result: "a", title: "好レセプション(A)", emoji: "🤲", base: "N" }],
  dig: [{ result: "up", title: "ナイスディグ", emoji: "🤿", base: "N" }],
};

/** イベント群 → カード（新しい順）。URは約8%で抽選。 */
export function buildCards(events: StatEvent[]): PlayCard[] {
  const cards: PlayCard[] = [];
  for (const e of events) {
    const defs = NOTABLE[e.skill];
    if (!defs) continue;
    const def = defs.find((d) => d.result === e.result);
    if (!def) continue;
    let rarity = def.base;
    // 上位プレー(SR)は一定確率でUR昇格、Rも稀にUR
    const r = hash01(e.id);
    if ((def.base === "SR" && r > 0.92) || (def.base === "R" && r > 0.98)) rarity = "UR";
    cards.push({
      id: e.id,
      rarity,
      title: def.title,
      emoji: def.emoji,
      playerName: e.playerName,
      jersey: e.jersey,
      at: e.createdAt ?? 0,
    });
  }
  return cards.sort((a, b) => b.at - a.at);
}

const ORDER: Record<Rarity, number> = { UR: 0, SR: 1, R: 2, N: 3 };
export function byRarity(a: PlayCard, b: PlayCard): number {
  return ORDER[a.rarity] - ORDER[b.rarity] || b.at - a.at;
}
