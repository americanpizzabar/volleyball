"use client";

import { useRef } from "react";
import {
  ATTACK_LINE_BOTTOM,
  ATTACK_LINE_TOP,
  NET_Y,
  clamp,
} from "@/lib/court";
import type { TacticPlayer, TacticPositions } from "@/lib/types";

const TOKEN_R = 5.2;

const TOKEN_STYLES: Record<TacticPlayer["team"], { fill: string; stroke: string; text: string }> = {
  ours: { fill: "#4f46e5", stroke: "#3730a3", text: "#ffffff" },
  theirs: { fill: "#64748b", stroke: "#334155", text: "#ffffff" },
  ball: { fill: "#fde047", stroke: "#ca8a04", text: "#713f12" },
};

interface Props {
  players: TacticPlayer[];
  positions: TacticPositions;
  /** When provided, tokens become draggable and report new positions. */
  onMove?: (playerId: string, x: number, y: number) => void;
  className?: string;
}

/** SVG volleyball court with draggable player/ball tokens. Pure presentation. */
export default function CourtCanvas({ players, positions, onMove, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragId = useRef<string | null>(null);

  function toCourt(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 3, 97);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 3, 97);
    return { x, y };
  }

  function handlePointerDown(e: React.PointerEvent, id: string) {
    if (!onMove) return;
    e.preventDefault();
    dragId.current = id;
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!onMove || !dragId.current) return;
    const { x, y } = toCourt(e.clientX, e.clientY);
    onMove(dragId.current, x, y);
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (dragId.current) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      dragId.current = null;
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={`aspect-square w-full touch-none select-none rounded-2xl ${className ?? ""}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* court surface */}
      <rect x="0" y="0" width="100" height="100" rx="3" fill="#f59e42" opacity="0.12" />
      <rect x="3" y="3" width="94" height="94" fill="#fb923c" opacity="0.16" stroke="#ea580c" strokeWidth="0.7" />
      {/* attack lines */}
      <line x1="3" y1={ATTACK_LINE_TOP} x2="97" y2={ATTACK_LINE_TOP} stroke="#ea580c" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
      <line x1="3" y1={ATTACK_LINE_BOTTOM} x2="97" y2={ATTACK_LINE_BOTTOM} stroke="#ea580c" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
      {/* net */}
      <line x1="0" y1={NET_Y} x2="100" y2={NET_Y} stroke="#1e293b" strokeWidth="1.4" />
      <line x1="0" y1={NET_Y} x2="100" y2={NET_Y} stroke="#ffffff" strokeWidth="1.4" strokeDasharray="1.4 1.4" />
      <text x="50" y={NET_Y - 1.2} textAnchor="middle" fontSize="3" fill="#475569">ネット</text>
      <text x="6" y="97" fontSize="3" fill="#94a3b8">自コート</text>

      {/* tokens */}
      {players.map((p) => {
        const pos = positions[p.id];
        if (!pos) return null;
        const s = TOKEN_STYLES[p.team];
        const r = p.team === "ball" ? TOKEN_R * 0.62 : TOKEN_R;
        return (
          <g
            key={p.id}
            transform={`translate(${pos.x} ${pos.y})`}
            style={{ cursor: onMove ? "grab" : "default" }}
            onPointerDown={(e) => handlePointerDown(e, p.id)}
          >
            <circle r={r} fill={s.fill} stroke={s.stroke} strokeWidth="0.7" />
            {p.team !== "ball" && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="4.2"
                fontWeight="700"
                fill={s.text}
                pointerEvents="none"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
