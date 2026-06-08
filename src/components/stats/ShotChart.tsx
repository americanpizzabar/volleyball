"use client";

import { useMemo, useState } from "react";
import TargetCourt, { type HeatCell, type ShotPoint } from "./TargetCourt";
import type { StatEvent } from "@/lib/stats";

const COLOR: Record<string, string> = {
  kill: "#10b981",
  error: "#ef4444",
  blocked: "#f97316",
};

const GRID = 3; // 3x3 ゾーン

/** スパイクの落下地点をコート上に表示（点 / 配球ヒートマップ）。 */
export default function ShotChart({ events }: { events: StatEvent[] }) {
  const [mode, setMode] = useState<"point" | "heat">("point");

  const shots = useMemo(
    () => events.filter((e) => e.skill === "spike" && e.x != null && e.y != null),
    [events],
  );

  const points = useMemo<ShotPoint[]>(
    () => shots.map((e) => ({ x: e.x as number, y: e.y as number, color: COLOR[e.result] ?? "#64748b" })),
    [shots],
  );

  const cells = useMemo<HeatCell[]>(() => {
    if (shots.length === 0) return [];
    const counts: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    for (const e of shots) {
      const cx = Math.min(GRID - 1, Math.floor(((e.x as number) / 100) * GRID));
      const cy = Math.min(GRID - 1, Math.floor(((e.y as number) / 100) * GRID));
      counts[cy][cx] += 1;
    }
    const max = Math.max(...counts.flat(), 1);
    const out: HeatCell[] = [];
    for (let cy = 0; cy < GRID; cy++) {
      for (let cx = 0; cx < GRID; cx++) {
        if (counts[cy][cx] === 0) continue;
        out.push({
          x0: (cx / GRID) * 100,
          x1: ((cx + 1) / GRID) * 100,
          y0: (cy / GRID) * 100,
          y1: ((cy + 1) / GRID) * 100,
          intensity: counts[cy][cx] / max,
        });
      }
    }
    return out;
  }, [shots]);

  if (shots.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        コート入力／なぞる入力のスパイク記録がまだありません。
      </p>
    );
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("point")}
            className={`chip ring-1 ${mode === "point" ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}
          >
            点
          </button>
          <button
            onClick={() => setMode("heat")}
            className={`chip ring-1 ${mode === "heat" ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}
          >
            ヒートマップ
          </button>
        </div>
        <span className="ml-auto text-xs text-slate-400">計 {shots.length} 本</span>
      </div>
      {mode === "point" && (
        <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
          <Legend color="#10b981" label="決定" />
          <Legend color="#ef4444" label="ミス" />
          <Legend color="#f97316" label="被ブロック" />
        </div>
      )}
      <TargetCourt points={mode === "point" ? points : []} cells={mode === "heat" ? cells : []} />
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
