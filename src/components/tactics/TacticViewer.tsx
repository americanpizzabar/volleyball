"use client";

import { useEffect, useRef, useState } from "react";
import CourtCanvas from "./CourtCanvas";
import { interpolate } from "@/lib/court";
import type { Tactic, TacticPositions } from "@/lib/types";

const SEGMENT_MS = 1400; // time to move between two keyframes
const HOLD_MS = 600; // pause on each keyframe

/**
 * Read-only animated rotation viewer. Students can scrub keyframes or hit play
 * to watch the movement ("サーブが打たれたら前衛セッターはここへ走る") on the train.
 */
export default function TacticViewer({ tactic }: { tactic: Tactic }) {
  const frames = tactic.keyframes;
  const [index, setIndex] = useState(0);
  const [positions, setPositions] = useState<TacticPositions>(
    frames[0]?.positions ?? {},
  );
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  // Show the selected keyframe when not playing.
  useEffect(() => {
    if (!playing) setPositions(frames[index]?.positions ?? {});
  }, [index, playing, frames]);

  function stop() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPlaying(false);
  }

  function play() {
    if (frames.length < 2) return;
    setPlaying(true);
    let seg = 0; // segment from frame seg → seg+1
    let start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const from = frames[seg].positions;
      const to = frames[seg + 1].positions;

      if (elapsed < SEGMENT_MS) {
        const t = easeInOut(elapsed / SEGMENT_MS);
        setPositions(interpolate(from, to, t, tactic.players));
        raf.current = requestAnimationFrame(tick);
      } else if (elapsed < SEGMENT_MS + HOLD_MS) {
        setPositions(to);
        setIndex(seg + 1);
        raf.current = requestAnimationFrame(tick);
      } else {
        seg += 1;
        if (seg >= frames.length - 1) {
          stop();
          return;
        }
        start = now;
        raf.current = requestAnimationFrame(tick);
      }
    };
    setIndex(0);
    setPositions(frames[0].positions);
    start = performance.now();
    raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="space-y-3">
      <CourtCanvas players={tactic.players} positions={positions} />

      <div className="flex items-center gap-2">
        <button
          onClick={playing ? stop : play}
          disabled={frames.length < 2}
          className="btn-primary flex-1"
        >
          {playing ? "⏸ 停止" : "▶ アニメーション再生"}
        </button>
      </div>

      {frames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {frames.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                stop();
                setIndex(i);
              }}
              className={`chip ring-1 transition ${
                i === index
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {i + 1}. {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
