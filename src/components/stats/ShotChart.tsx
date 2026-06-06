"use client";

import { useMemo } from "react";
import TargetCourt, { type ShotPoint } from "./TargetCourt";
import type { StatEvent } from "@/lib/stats";

const COLOR: Record<string, string> = {
  kill: "#10b981",
  error: "#ef4444",
  blocked: "#f97316",
};

/** スパイクの落下地点をコート上に表示。座標を持つイベントのみ対象。 */
export default function ShotChart({ events }: { events: StatEvent[] }) {
  const points = useMemo<ShotPoint[]>(
    () =>
      events
        .filter((e) => e.skill === "spike" && e.x != null && e.y != null)
        .map((e) => ({ x: e.x as number, y: e.y as number, color: COLOR[e.result] ?? "#64748b" })),
    [events],
  );

  if (points.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        コート入力のスパイク記録がまだありません。
      </p>
    );
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
        <Legend color="#10b981" label="決定" />
        <Legend color="#ef4444" label="ミス" />
        <Legend color="#f97316" label="被ブロック" />
        <span className="ml-auto">計 {points.length} 本</span>
      </div>
      <TargetCourt points={points} />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
