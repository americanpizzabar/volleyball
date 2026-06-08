"use client";

import { useMemo, useState } from "react";
import TargetCourt, { type HeatCell, type ShotPoint } from "./TargetCourt";
import type { StatEvent } from "@/lib/stats";

const COLOR: Record<string, string> = {
  kill: "#10b981",
  error: "#ef4444",
  blocked: "#f97316",
};
const RESULTS: { key: string; label: string }[] = [
  { key: "kill", label: "決定" },
  { key: "error", label: "ミス" },
  { key: "blocked", label: "被ブロック" },
];
const GRID = 3; // 3x3 ゾーン

/** スパイクの落下地点を表示（点 / 配球ヒートマップ）。選手・結果で絞り込み可。 */
export default function ShotChart({ events }: { events: StatEvent[] }) {
  const [mode, setMode] = useState<"point" | "heat">("point");
  const [player, setPlayer] = useState<string>("all");
  const [results, setResults] = useState<Set<string>>(new Set(["kill", "error", "blocked"]));

  const allShots = useMemo(
    () => events.filter((e) => e.skill === "spike" && e.x != null && e.y != null),
    [events],
  );

  // 選手リスト（背番号順）
  const players = useMemo(() => {
    const map = new Map<string, { id: string; label: string; jersey: number | null }>();
    for (const e of allShots) {
      if (!map.has(e.playerId)) {
        map.set(e.playerId, { id: e.playerId, label: e.playerName, jersey: e.jersey });
      }
    }
    return [...map.values()].sort((a, b) => (a.jersey ?? 999) - (b.jersey ?? 999));
  }, [allShots]);

  const shots = useMemo(
    () =>
      allShots.filter(
        (e) => (player === "all" || e.playerId === player) && results.has(e.result),
      ),
    [allShots, player, results],
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

  function toggleResult(key: string) {
    setResults((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (allShots.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        コート入力／なぞる入力のスパイク記録がまだありません。
      </p>
    );
  }

  return (
    <div className="card space-y-2">
      {/* mode + player */}
      <div className="flex flex-wrap items-center gap-2">
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
        <select
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
        >
          <option value="all">全選手</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.jersey != null ? `${p.jersey} ` : ""}
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* result filter */}
      <div className="flex flex-wrap gap-1.5">
        {RESULTS.map((r) => (
          <button
            key={r.key}
            onClick={() => toggleResult(r.key)}
            className={`chip ring-1 transition ${
              results.has(r.key)
                ? "text-white ring-transparent"
                : "bg-white text-slate-400 ring-slate-200"
            }`}
            style={results.has(r.key) ? { backgroundColor: COLOR[r.key] } : undefined}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-400">計 {shots.length} 本</span>
      </div>

      <TargetCourt points={mode === "point" ? points : []} cells={mode === "heat" ? cells : []} />
    </div>
  );
}
