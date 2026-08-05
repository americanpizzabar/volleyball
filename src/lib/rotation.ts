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

/**
 * サーブレシーブ隊形の一例（後衛を広げ、セッター(想定スロット1)は後右で
 * 前衛2より後ろに位置＝反則にならない合法な配置）。
 */
export const SLOT_RECEIVE: Record<number, Pt> = {
  4: { x: 20, y: 70 },
  3: { x: 44, y: 78 },
  2: { x: 70, y: 72 },
  5: { x: 16, y: 92 },
  6: { x: 50, y: 95 },
  1: { x: 66, y: 84 },
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

export interface Zone {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * 指定スロットの選手が「反則にならずに動ける範囲（セーフゾーン）」を、
 * 他の5人の現在位置から算出。範囲が成立しない場合は null。
 */
export function safeZoneForSlot(slot: number, pos: Record<number, Pt>): Zone | null {
  for (let s = 1; s <= 6; s++) if (!pos[s]) return null;
  const X = (s: number) => pos[s].x;
  const Y = (s: number) => pos[s].y;
  let x0 = 3, x1 = 97, y0 = 3, y1 = 97;

  switch (slot) {
    case 1: // 後右：6より右、2より後ろ
      x0 = X(6); y0 = Y(2); break;
    case 2: // 前右：3より右、1より前
      x0 = X(3); y1 = Y(1); break;
    case 3: // 前中：4と2の間、6より前
      x0 = X(4); x1 = X(2); y1 = Y(6); break;
    case 4: // 前左：3より左、5より前
      x1 = X(3); y1 = Y(5); break;
    case 5: // 後左：6より左、4より後ろ
      x1 = X(6); y0 = Y(4); break;
    case 6: // 後中：5と1の間、3より後ろ
      x0 = X(5); x1 = X(1); y0 = Y(3); break;
    default:
      return null;
  }

  x0 = Math.max(3, x0);
  x1 = Math.min(97, x1);
  y0 = Math.max(3, y0);
  y1 = Math.min(97, y1);
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { x0, y0, x1, y1 };
}

/** 点が指定スロットのセーフゾーン内かどうか。 */
export function isInsideSafeZone(slot: number, pos: Record<number, Pt>): boolean {
  const z = safeZoneForSlot(slot, pos);
  if (!z) return false;
  const p = pos[slot];
  return p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1;
}
