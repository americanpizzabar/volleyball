// ローテーション & ポジショナルフォールト（かぶり）判定エンジン。
//
// コート座標系は court.ts と同じ：x 0(左)→100(右)、y 0(ネット)→100(自エンド)。
// 6 人はポジション番号(スロット) 1〜6 を持つ：
//   2(前右) 3(前中) 4(前左) / 1(後右) 6(後中) 5(後左)

export interface Pt {
  x: number;
  y: number;
}

/** スロット番号ごとの基本配置。 */
export const SLOT_BASE: Record<number, Pt> = {
  4: { x: 22, y: 63 }, // 前左
  3: { x: 50, y: 63 }, // 前中
  2: { x: 78, y: 63 }, // 前右
  5: { x: 22, y: 90 }, // 後左
  6: { x: 50, y: 90 }, // 後中
  1: { x: 78, y: 90 }, // 後右
};

/** サーブレシーブ隊形の一例（後衛を広げ、セッター(想定スロット1)が前へ）。 */
export const SLOT_RECEIVE: Record<number, Pt> = {
  4: { x: 20, y: 70 },
  3: { x: 44, y: 78 },
  2: { x: 70, y: 72 },
  5: { x: 16, y: 92 },
  6: { x: 50, y: 95 },
  1: { x: 60, y: 60 },
};

// 時計回りローテ：2→1→6→5→4→3→2
export const ROTATE_NEXT: Record<number, number> = { 2: 1, 1: 6, 6: 5, 5: 4, 4: 3, 3: 2 };
export const ROTATE_PREV: Record<number, number> = { 1: 2, 6: 1, 5: 6, 4: 5, 3: 4, 2: 3 };

export interface FaultPair {
  a: number; // スロット
  b: number; // スロット
  reason: string;
}

/**
 * サーブ時の隊形に対し、隣接プレーヤー間の追い越し（かぶり）を判定。
 * pos はスロット番号→座標。6 スロット揃っていない場合は空配列。
 */
export function detectFaults(pos: Record<number, Pt>): FaultPair[] {
  for (let s = 1; s <= 6; s++) if (!pos[s]) return [];
  const faults: FaultPair[] = [];
  const x = (s: number) => pos[s].x;
  const y = (s: number) => pos[s].y;

  // 前衛の左右順：4 < 3 < 2
  if (x(4) >= x(3)) faults.push({ a: 4, b: 3, reason: "前衛の左右が逆（4は3より左）" });
  if (x(3) >= x(2)) faults.push({ a: 3, b: 2, reason: "前衛の左右が逆（3は2より左）" });
  // 後衛の左右順：5 < 6 < 1
  if (x(5) >= x(6)) faults.push({ a: 5, b: 6, reason: "後衛の左右が逆（5は6より左）" });
  if (x(6) >= x(1)) faults.push({ a: 6, b: 1, reason: "後衛の左右が逆（6は1より左）" });
  // 前後関係：前衛は対応する後衛より前（ネット側）
  if (y(2) >= y(1)) faults.push({ a: 2, b: 1, reason: "右の前後が逆（2は1より前）" });
  if (y(3) >= y(6)) faults.push({ a: 3, b: 6, reason: "中央の前後が逆（3は6より前）" });
  if (y(4) >= y(5)) faults.push({ a: 4, b: 5, reason: "左の前後が逆（4は5より前）" });

  return faults;
}

/** 全スロットを 1 つ進める/戻す（プレーヤーは固定で、占めるスロットが変わる）。 */
export function rotateSlots(
  slotOf: Record<string, number>,
  dir: "next" | "prev",
): Record<string, number> {
  const map = dir === "next" ? ROTATE_NEXT : ROTATE_PREV;
  const out: Record<string, number> = {};
  for (const [id, slot] of Object.entries(slotOf)) out[id] = map[slot];
  return out;
}
