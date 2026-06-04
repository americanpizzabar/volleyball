// Skill-check definitions for the portfolio (機能③).
// Each member rates common skills plus the skills for their position, on a
// 1–5 scale, with both a self rating and a coach rating.
import type { Position } from "./types";

export interface SkillItem {
  key: string;
  label: string;
  /** "all" = everyone; otherwise only shown for these positions. */
  positions: "all" | Position[];
}

export const SKILL_GROUPS: { title: string; items: SkillItem[] }[] = [
  {
    title: "基礎スキル（全員）",
    items: [
      { key: "serve", label: "サーブの安定性", positions: "all" },
      { key: "serve_power", label: "サーブの攻撃力", positions: "all" },
      { key: "reception", label: "サーブレシーブの正確性", positions: "all" },
      { key: "dig", label: "ディグ（拾う範囲）", positions: "all" },
      { key: "spike", label: "スパイクの助走・スイング", positions: "all" },
      { key: "block", label: "ブロックのタイミング", positions: "all" },
      { key: "judgement", label: "状況判断・コート視野", positions: "all" },
      { key: "fitness", label: "体力・走力", positions: "all" },
      { key: "mental", label: "メンタル・声出し", positions: "all" },
    ],
  },
  {
    title: "セッター",
    items: [
      { key: "s_set2", label: "2段トスの正確性", positions: ["S"] },
      { key: "s_distribute", label: "トス配給の判断", positions: ["S"] },
      { key: "s_tempo", label: "速攻のテンポ", positions: ["S"] },
      { key: "s_two", label: "ツーアタック", positions: ["S"] },
    ],
  },
  {
    title: "ミドルブロッカー",
    items: [
      { key: "mb_commit", label: "コミットブロックの反応", positions: ["MB"] },
      { key: "mb_read", label: "リードブロックの移動", positions: ["MB"] },
      { key: "mb_quick", label: "速攻の入り", positions: ["MB"] },
    ],
  },
  {
    title: "アウトサイドヒッター",
    items: [
      { key: "oh_recv_attack", label: "レセプションアタック", positions: ["OH"] },
      { key: "oh_open", label: "オープントスの処理", positions: ["OH"] },
      { key: "oh_rally", label: "ラリー中の対応力", positions: ["OH"] },
    ],
  },
  {
    title: "オポジット",
    items: [
      { key: "op_back", label: "バックアタックの決定力", positions: ["OP"] },
      { key: "op_right", label: "ライトからの強打", positions: ["OP"] },
      { key: "op_block", label: "ブロックの高さ・幅", positions: ["OP"] },
    ],
  },
  {
    title: "リベロ / DS",
    items: [
      { key: "l_range", label: "サーブレシーブ範囲", positions: ["L", "DS"] },
      { key: "l_dig", label: "ディグの反応速度", positions: ["L", "DS"] },
      { key: "l_lead", label: "守備の統率・指示", positions: ["L", "DS"] },
    ],
  },
];

/** Skill groups relevant to a position (common + that position's group). */
export function skillGroupsForPosition(position: Position | null | undefined) {
  return SKILL_GROUPS.map((g) => ({
    title: g.title,
    items: g.items.filter(
      (it) => it.positions === "all" || (position && it.positions.includes(position)),
    ),
  })).filter((g) => g.items.length > 0);
}

export const RATING_LABELS: Record<number, string> = {
  1: "要強化",
  2: "あと一歩",
  3: "標準",
  4: "得意",
  5: "武器",
};
