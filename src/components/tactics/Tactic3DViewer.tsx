"use client";

import { Canvas } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { interpolate } from "@/lib/court";
import type { Tactic, TacticPositions } from "@/lib/types";

const SEGMENT_MS = 1500;
const COURT_W = 9; // x方向（サイドライン幅）
const COURT_D = 18; // z方向（全長）

// コート座標(0-100) → ワールド座標
function toWorldX(x: number) {
  return (x / 100 - 0.5) * COURT_W;
}
function toWorldZ(y: number) {
  return (y / 100 - 0.5) * COURT_D;
}

const TOKEN_COLOR: Record<string, string> = {
  ours: "#4f46e5",
  theirs: "#64748b",
  ball: "#fde047",
};

export default function Tactic3DViewer({ tactic }: { tactic: Tactic }) {
  const frames = tactic.keyframes;
  const segments = Math.max(0, frames.length - 1);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  const seg = Math.min(segments - 1, Math.max(0, Math.floor(progress)));
  const frac = segments > 0 ? progress - seg : 0;

  const positions = useMemo<TacticPositions>(() => {
    if (segments === 0) return frames[0]?.positions ?? {};
    return interpolate(frames[seg].positions, frames[seg + 1].positions, easeInOut(frac), tactic.players);
  }, [segments, seg, frac, frames, tactic.players]);

  // ボールの放物線の高さ（現区間の水平距離に応じて山なり）
  const ballHeight = useMemo(() => {
    const ball = tactic.players.find((p) => p.team === "ball");
    if (!ball || segments === 0) return 0.3;
    const a = frames[seg].positions[ball.id];
    const b = frames[seg + 1].positions[ball.id];
    if (!a || !b) return 0.3;
    const dist = Math.hypot(toWorldX(b.x) - toWorldX(a.x), toWorldZ(b.y) - toWorldZ(a.y));
    const arc = Math.min(4, dist * 0.4);
    return 0.3 + arc * Math.sin(Math.PI * frac);
  }, [tactic.players, frames, seg, frac, segments]);

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
      setProgress(Math.min(segments, (elapsed / total) * segments));
      if (elapsed >= total) return stop();
      raf.current = requestAnimationFrame(tick);
    };
    setProgress(0);
    raf.current = requestAnimationFrame(tick);
  }
  useEffect(() => () => stop(), []);

  // 助走ベクトル（現区間の移動）
  const arrows = useMemo(() => {
    if (segments === 0) return [];
    const from = frames[seg].positions;
    const to = frames[seg + 1].positions;
    return tactic.players
      .filter((p) => p.team !== "ball")
      .map((p) => {
        const a = from[p.id];
        const b = to[p.id];
        if (!a || !b || Math.hypot(b.x - a.x, b.y - a.y) < 3) return null;
        return {
          id: p.id,
          pts: [
            [toWorldX(a.x), 0.06, toWorldZ(a.y)],
            [toWorldX(b.x), 0.06, toWorldZ(b.y)],
          ] as [number, number, number][],
        };
      })
      .filter((x): x is { id: string; pts: [number, number, number][] } => !!x);
  }, [segments, seg, frames, tactic.players]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900" style={{ height: 360 }}>
        <Canvas camera={{ position: [0, 11, 14], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[6, 12, 6]} intensity={1.1} castShadow />

          {/* 床（コート） */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[COURT_W + 2, COURT_D + 2]} />
            <meshStandardMaterial color="#f59e42" />
          </mesh>
          {/* コートライン */}
          <Line points={courtOutline()} color="#ffffff" lineWidth={2} />
          <Line points={[[-COURT_W / 2, 0.02, 0], [COURT_W / 2, 0.02, 0]]} color="#ffffff" lineWidth={2} />
          {/* アタックライン */}
          <Line points={[[-COURT_W / 2, 0.02, COURT_D / 6], [COURT_W / 2, 0.02, COURT_D / 6]]} color="#ffffff" lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />
          <Line points={[[-COURT_W / 2, 0.02, -COURT_D / 6], [COURT_W / 2, 0.02, -COURT_D / 6]]} color="#ffffff" lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />

          {/* ネット */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[COURT_W, 1, 0.06]} />
            <meshStandardMaterial color="#1e293b" transparent opacity={0.45} />
          </mesh>

          {/* 助走ベクトル */}
          {arrows.map((a) => (
            <Line key={a.id} points={a.pts} color="#a5b4fc" lineWidth={3} />
          ))}

          {/* トークン */}
          {tactic.players.map((p) => {
            const pos = positions[p.id];
            if (!pos) return null;
            const isBall = p.team === "ball";
            const wx = toWorldX(pos.x);
            const wz = toWorldZ(pos.y);
            if (isBall) {
              return (
                <mesh key={p.id} position={[wx, ballHeight, wz]} castShadow>
                  <sphereGeometry args={[0.3, 20, 20]} />
                  <meshStandardMaterial color={TOKEN_COLOR.ball} emissive="#ca8a04" emissiveIntensity={0.3} />
                </mesh>
              );
            }
            return (
              <group key={p.id} position={[wx, 0, wz]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                  <cylinderGeometry args={[0.45, 0.45, 1.2, 24]} />
                  <meshStandardMaterial color={TOKEN_COLOR[p.team]} />
                </mesh>
                <Html position={[0, 1.5, 0]} center distanceFactor={12}>
                  <div className="select-none rounded-full bg-white/90 px-1.5 text-xs font-black text-slate-800 shadow">
                    {p.label}
                  </div>
                </Html>
              </group>
            );
          })}

          <OrbitControls enablePan={false} minDistance={8} maxDistance={28} maxPolarAngle={Math.PI / 2.2} target={[0, 0, 0]} />
        </Canvas>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        指でドラッグ＝カメラ回転 / ピンチ＝ズーム。下のバーで再生。
      </p>

      {/* timeline */}
      {segments > 0 && (
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
      )}
      <button onClick={playing ? stop : play} disabled={segments === 0} className="btn-primary w-full">
        {playing ? "⏸ 停止" : "▶ 3D再生"}
      </button>
    </div>
  );
}

function courtOutline(): [number, number, number][] {
  const x = COURT_W / 2;
  const z = COURT_D / 2;
  return [
    [-x, 0.02, -z],
    [x, 0.02, -z],
    [x, 0.02, z],
    [-x, 0.02, z],
    [-x, 0.02, -z],
  ];
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
