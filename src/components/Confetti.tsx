"use client";

import { useEffect, useState } from "react";

const COLORS = ["#4f46e5", "#f97316", "#10b981", "#fde047", "#ef4444", "#3b82f6"];

interface Piece {
  left: number;
  bg: string;
  delay: number;
  dur: number;
  rot: number;
}

/** 軽量な紙吹雪（外部ライブラリ不要）。表示する間だけマウントする。 */
export default function Confetti({ count = 36 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        bg: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        dur: 1 + Math.random() * 1.2,
        rot: Math.random() * 360,
      })),
    );
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.bg,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
