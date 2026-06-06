"use client";

import { useRef } from "react";

// 相手コート（攻撃の落下地点）。viewBox 100 x 70。
// 保存座標は x:0(左)→100(右), y:0(ネット側)→100(エンドライン奥)。
const X0 = 4, X1 = 96, Y_NET = 62, Y_END = 4;
const W = X1 - X0; // 92
const H = Y_NET - Y_END; // 58
const ATTACK_Y = Y_NET - (3 / 9) * H; // 3m ライン

export interface ShotPoint {
  x: number;
  y: number;
  color: string; // 点の色
}

function toSvg(x: number, y: number) {
  return { sx: X0 + (x / 100) * W, sy: Y_NET - (y / 100) * H };
}

export default function TargetCourt({
  onTap,
  points,
  className,
}: {
  onTap?: (x: number, y: number) => void;
  points?: ShotPoint[];
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  function handleClick(e: React.PointerEvent) {
    if (!onTap) return;
    const rect = ref.current!.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * 100;
    const vy = ((e.clientY - rect.top) / rect.height) * 70;
    const x = Math.min(100, Math.max(0, ((vx - X0) / W) * 100));
    const y = Math.min(100, Math.max(0, ((Y_NET - vy) / H) * 100));
    onTap(x, y);
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 70"
      onPointerDown={handleClick}
      className={`w-full touch-none select-none rounded-2xl ${onTap ? "cursor-crosshair" : ""} ${className ?? ""}`}
    >
      <rect x="0" y="0" width="100" height="70" fill="#fb923c" opacity="0.08" rx="3" />
      <rect x={X0} y={Y_END} width={W} height={H} fill="#fb923c" opacity="0.16" stroke="#ea580c" strokeWidth="0.7" />
      {/* attack line */}
      <line x1={X0} y1={ATTACK_Y} x2={X1} y2={ATTACK_Y} stroke="#ea580c" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
      {/* 6 zones guide */}
      <line x1={X0 + W / 3} y1={Y_END} x2={X0 + W / 3} y2={Y_NET} stroke="#ea580c" strokeWidth="0.3" opacity="0.3" />
      <line x1={X0 + (2 * W) / 3} y1={Y_END} x2={X0 + (2 * W) / 3} y2={Y_NET} stroke="#ea580c" strokeWidth="0.3" opacity="0.3" />
      {/* net */}
      <line x1="0" y1={Y_NET} x2="100" y2={Y_NET} stroke="#1e293b" strokeWidth="1.4" />
      <line x1="0" y1={Y_NET} x2="100" y2={Y_NET} stroke="#ffffff" strokeWidth="1.4" strokeDasharray="1.4 1.4" />
      <text x="50" y={Y_NET + 5} textAnchor="middle" fontSize="3.5" fill="#475569">ネット（自分側）</text>
      <text x="50" y={Y_END - 0.5} textAnchor="middle" fontSize="3" fill="#94a3b8">相手エンドライン</text>

      {(points ?? []).map((p, i) => {
        const { sx, sy } = toSvg(p.x, p.y);
        return <circle key={i} cx={sx} cy={sy} r="1.8" fill={p.color} stroke="#fff" strokeWidth="0.4" />;
      })}
    </svg>
  );
}
