"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CourtCanvas from "./CourtCanvas";
import { interpolate } from "@/lib/court";
import type { Tactic, TacticPositions } from "@/lib/types";

const SEGMENT_MS = 1500; // time to move between two keyframes

/**
 * アニメーション付き戦術ビューア。再生バーをなぞるとボールが放物線で動き、
 * 選手の助走ベクトル（矢印）も表示される。通学中の予習に。
 */
export default function TacticViewer({ tactic }: { tactic: Tactic }) {
  const frames = tactic.keyframes;
  const segments = Math.max(0, frames.length - 1);
  const [progress, setProgress] = useState(0); // 0 .. segments
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  const seg = Math.min(segments - 1, Math.max(0, Math.floor(progress)));
  const frac = segments > 0 ? progress - seg : 0;

  // 現在の表示位置（区間内をイージング補間）
  const positions = useMemo<TacticPositions>(() => {
    if (segments === 0) return frames[0]?.positions ?? {};
    return interpolate(
      frames[seg].positions,
      frames[seg + 1].positions,
      easeInOut(frac),
      tactic.players,
    );
  }, [segments, seg, frac, frames, tactic.players]);

  // 助走ベクトル：今の区間で各選手が移動する方向の矢印
  const arrows = useMemo(() => {
    if (segments === 0) return [];
    const from = frames[seg].positions;
    const to = frames[seg + 1].positions;
    return tactic.players
      .filter((p) => p.team !== "ball")
      .map((p) => {
        const a = from[p.id];
        const b = to[p.id];
        if (!a || !b) return null;
        if (Math.hypot(b.x - a.x, b.y - a.y) < 3) return null;
        return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
      })
      .filter((x): x is { x1: number; y1: number; x2: number; y2: number } => !!x);
  }, [segments, seg, frames, tactic.players]);

  // ボールの軌道（全コマを通した放物線）
  const trajectory = useMemo(() => {
    const ball = tactic.players.find((p) => p.team === "ball");
    if (!ball || frames.length < 2) return "";
    const pts = frames
      .map((f) => f.positions[ball.id])
      .filter((p): p is { x: number; y: number } => !!p);
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mx = (a.x + b.x) / 2;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const my = (a.y + b.y) / 2 - dist * 0.35; // 上方向に膨らませて放物線に
      d += ` Q ${mx} ${my} ${b.x} ${b.y}`;
    }
    return d;
  }, [frames, tactic.players]);

  function stop() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPlaying(false);
  }

  function play() {
    if (segments === 0) return;
    setPlaying(true);
    const total = segments * SEGMENT_MS;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(segments, (elapsed / total) * segments);
      setProgress(p);
      if (elapsed >= total) {
        stop();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    setProgress(0);
    raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="space-y-3">
      <CourtCanvas
        players={tactic.players}
        positions={positions}
        arrows={arrows}
        trajectory={trajectory}
      />

      {/* timeline scrubber */}
      {segments > 0 && (
        <div>
          <input
            type="range"
            min={0}
            max={segments}
            step={0.01}
            value={progress}
            onChange={(e) => {
              stop();
              setProgress(Number(e.target.value));
            }}
            className="w-full accent-brand-600"
            aria-label="再生バー"
          />
          <div className="mt-1 flex justify-between">
            {frames.map((f, i) => (
              <button
                key={f.id}
                onClick={() => {
                  stop();
                  setProgress(i);
                }}
                className={`max-w-[5rem] truncate text-[10px] font-medium ${
                  Math.round(progress) === i ? "text-brand-600" : "text-slate-400"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={playing ? stop : play}
        disabled={segments === 0}
        className="btn-primary w-full"
      >
        {playing ? "⏸ 停止" : "▶ アニメーション再生"}
      </button>

      <p className="text-center text-[11px] text-slate-400">
        再生バーを指でなぞると、ボールの軌道（放物線）と選手の助走ベクトルが連動して動きます。
      </p>
    </div>
  );
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
