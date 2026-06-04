// Volleyball court geometry + tactic-board helpers.
//
// Coordinate system used across the tactic board:
//   x: 0 (left sideline) → 100 (right sideline)
//   y: 0 (opponent end line) → 100 (our end line)
// The net is the horizontal line at y = 50. Our half is the bottom (y 50–100),
// so players naturally read the board as if standing behind their own end line.

import type { TacticKeyframe, TacticPlayer, TacticPositions } from "./types";

export const NET_Y = 50;
export const ATTACK_LINE_TOP = 50 - (3 / 9) * 50; // 3m line on opponent side
export const ATTACK_LINE_BOTTOM = 50 + (3 / 9) * 50; // 3m line on our side

/** Standard rotation positions on our half, labelled by position number 1–6. */
export const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
  p4: { x: 22, y: 63 }, // front left
  p3: { x: 50, y: 63 }, // front center
  p2: { x: 78, y: 63 }, // front right
  p5: { x: 22, y: 90 }, // back left
  p6: { x: 50, y: 90 }, // back center
  p1: { x: 78, y: 90 }, // back right
};

/** Six "ours" tokens labelled by position number at standard spots. */
export function defaultPlayers(): TacticPlayer[] {
  return [
    { id: "p1", label: "1", team: "ours" },
    { id: "p2", label: "2", team: "ours" },
    { id: "p3", label: "3", team: "ours" },
    { id: "p4", label: "4", team: "ours" },
    { id: "p5", label: "5", team: "ours" },
    { id: "p6", label: "6", team: "ours" },
  ];
}

export function defaultPositions(): TacticPositions {
  return {
    p1: { ...BASE_POSITIONS.p1 },
    p2: { ...BASE_POSITIONS.p2 },
    p3: { ...BASE_POSITIONS.p3 },
    p4: { ...BASE_POSITIONS.p4 },
    p5: { ...BASE_POSITIONS.p5 },
    p6: { ...BASE_POSITIONS.p6 },
  };
}

export function defaultKeyframe(name: string): TacticKeyframe {
  return {
    id: cryptoId(),
    name,
    positions: defaultPositions(),
  };
}

/** Linear interpolation between two keyframes' positions for animation. */
export function interpolate(
  from: TacticPositions,
  to: TacticPositions,
  t: number,
  players: TacticPlayer[],
): TacticPositions {
  const out: TacticPositions = {};
  for (const p of players) {
    const a = from[p.id] ?? to[p.id] ?? { x: 50, y: 75 };
    const b = to[p.id] ?? a;
    out[p.id] = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }
  return out;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Short random id that works in browser + node without extra deps. */
export function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
