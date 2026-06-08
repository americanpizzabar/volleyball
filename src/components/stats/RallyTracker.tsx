"use client";

import { useRef, useState } from "react";
import type { RosterPlayer } from "./StatRecorder";

// レイアウト（viewBox 100 x 132）。相手コートが上、自コートが下。
const OPP = { x0: 6, x1: 94, y0: 6, y1: 58 }; // 相手コート（着地点）
const NET_Y = 63;
const OUR = { x0: 6, x1: 94, y0: 68, y1: 126 };
const TOKEN_R = 6;

// 自コートの6つの定位置（前衛3・後衛3）
const SPOTS: { x: number; y: number }[] = [
  { x: 25, y: 78 }, // 前左
  { x: 50, y: 78 }, // 前中
  { x: 75, y: 78 }, // 前右
  { x: 25, y: 116 }, // 後左
  { x: 50, y: 116 }, // 後中
  { x: 75, y: 116 }, // 後右
];

export interface RallyEvent {
  player: RosterPlayer;
  skill: "reception" | "set" | "spike";
  result: string;
  x?: number;
  y?: number;
}

export interface RallyResult {
  events: RallyEvent[];
  killLabel: string;
}

export default function RallyTracker({
  players,
  onRally,
}: {
  players: RosterPlayer[];
  onRally: (r: RallyResult) => Promise<void> | void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onCourt = players.slice(0, 6);

  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [seq, setSeq] = useState<number[]>([]); // インデックス（onCourt）
  const drawing = useRef(false);
  const seqRef = useRef<number[]>([]);
  const [flash, setFlash] = useState<RallyResult | null>(null);
  const [hint, setHint] = useState("");

  function toView(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 132,
    };
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    drawing.current = true;
    seqRef.current = [];
    setSeq([]);
    setHint("");
    const p = toView(e.clientX, e.clientY);
    setPath([p]);
    hitTest(p);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = toView(e.clientX, e.clientY);
    setPath((prev) => [...prev, p]);
    hitTest(p);
  }

  function hitTest(p: { x: number; y: number }) {
    for (let i = 0; i < onCourt.length; i++) {
      const s = SPOTS[i];
      if (!s) continue;
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      if (d < TOKEN_R + 1) {
        const last = seqRef.current[seqRef.current.length - 1];
        if (last !== i) {
          seqRef.current = [...seqRef.current, i];
          setSeq(seqRef.current);
        }
        return;
      }
    }
  }

  async function up(e: React.PointerEvent) {
    if (!drawing.current) return;
    drawing.current = false;
    const end = toView(e.clientX, e.clientY);
    const indices = seqRef.current;

    // 判定：相手コートで離す＝決定
    const inOpp =
      end.x >= OPP.x0 && end.x <= OPP.x1 && end.y >= OPP.y0 && end.y <= OPP.y1;

    if (indices.length === 0) {
      setHint("選手の上をなぞって、相手コートで指を離してください。");
      reset();
      return;
    }
    if (!inOpp) {
      setHint("最後は相手コート内で指を離すと「スパイク決定」になります。");
      reset();
      return;
    }

    // 着地点を 0-100 に正規化（x:左→右, y:0ネット側→100奥）
    const lx = ((end.x - OPP.x0) / (OPP.x1 - OPP.x0)) * 100;
    const ly = ((OPP.y1 - end.y) / (OPP.y1 - OPP.y0)) * 100;

    const events: RallyEvent[] = [];
    const spiker = onCourt[indices[indices.length - 1]];
    const setter = indices.length >= 2 ? onCourt[indices[indices.length - 2]] : null;
    const receiver = indices.length >= 3 ? onCourt[indices[indices.length - 3]] : null;

    if (receiver) events.push({ player: receiver, skill: "reception", result: "a" });
    if (setter) events.push({ player: setter, skill: "set", result: "assist" });
    events.push({ player: spiker, skill: "spike", result: "kill", x: lx, y: ly });

    const result: RallyResult = { events, killLabel: "SPIKE KILL!" };
    setFlash(result);
    setTimeout(() => setFlash(null), 1500);
    reset();
    await onRally(result);
  }

  function reset() {
    setTimeout(() => {
      setPath([]);
      setSeq([]);
      seqRef.current = [];
    }, 250);
  }

  const pathD =
    path.length > 1 ? "M " + path.map((p) => `${p.x} ${p.y}`).join(" L ") : "";

  return (
    <div className="card relative overflow-hidden">
      <p className="mb-2 text-sm font-semibold text-slate-700">
        ラリーをなぞって入力
      </p>
      <p className="mb-2 text-xs text-slate-500">
        例：レシーバー → セッター → スパイカー → 相手コート、と一筆書き。指を離すと自動記録。
      </p>

      <svg
        ref={svgRef}
        viewBox="0 0 100 132"
        className="w-full touch-none select-none rounded-2xl"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      >
        {/* opponent court */}
        <rect x={OPP.x0} y={OPP.y0} width={OPP.x1 - OPP.x0} height={OPP.y1 - OPP.y0} rx="2" fill="#64748b" opacity="0.12" stroke="#475569" strokeWidth="0.6" />
        <text x="50" y="33" textAnchor="middle" fontSize="4" fill="#94a3b8">相手コート（ここで離す＝決定）</text>
        {/* net */}
        <line x1="2" y1={NET_Y} x2="98" y2={NET_Y} stroke="#1e293b" strokeWidth="1.4" />
        <line x1="2" y1={NET_Y} x2="98" y2={NET_Y} stroke="#fff" strokeWidth="1.4" strokeDasharray="1.4 1.4" />
        {/* our court */}
        <rect x={OUR.x0} y={OUR.y0} width={OUR.x1 - OUR.x0} height={OUR.y1 - OUR.y0} rx="2" fill="#fb923c" opacity="0.14" stroke="#ea580c" strokeWidth="0.6" />

        {/* stroke */}
        {pathD && <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />}

        {/* player tokens */}
        {onCourt.map((p, i) => {
          const s = SPOTS[i];
          if (!s) return null;
          const order = seq.indexOf(i);
          const active = order >= 0;
          return (
            <g key={p.id} transform={`translate(${s.x} ${s.y})`} pointerEvents="none">
              <circle r={TOKEN_R} fill={active ? "#4f46e5" : "#eef2ff"} stroke="#4f46e5" strokeWidth="0.8" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="5" fontWeight="700" fill={active ? "#fff" : "#4338ca"}>
                {p.jersey ?? "—"}
              </text>
              {active && (
                <text textAnchor="middle" y="-8" fontSize="3.4" fontWeight="700" fill="#4f46e5">
                  {order + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hint && <p className="mt-2 text-center text-xs text-amber-600">{hint}</p>}
      {onCourt.length < 1 && (
        <p className="mt-2 text-center text-xs text-slate-500">
          背番号を登録した選手がいません。設定で登録してください。
        </p>
      )}

      {/* effect popup */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="rally-pop text-4xl font-black text-emerald-500 drop-shadow">
            {flash.killLabel}
          </div>
          <div className="mt-2 flex flex-col items-center gap-1">
            {flash.events
              .filter((e) => e.skill !== "spike")
              .map((e, i) => (
                <span key={i} className="rally-sub rounded-full bg-white/90 px-3 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                  {e.skill === "reception" ? "Nice Receive!" : "Good Set!"}（{e.player.jersey ?? ""}）
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
