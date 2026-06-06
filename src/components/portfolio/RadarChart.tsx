"use client";

const CX = 50, CY = 52, R = 36, MAX = 5;

function point(i: number, n: number, value: number) {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  const r = (Math.min(MAX, Math.max(0, value)) / MAX) * R;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}
function axisPoint(i: number, n: number, mul = 1) {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  return { x: CX + R * mul * Math.cos(angle), y: CY + R * mul * Math.sin(angle) };
}

/** 6軸レーダー。self（本人）とavg（チーム平均）を重ね表示。 */
export default function RadarChart({
  labels,
  self,
  avg,
}: {
  labels: string[];
  self: number[];
  avg: number[];
}) {
  const n = labels.length;
  const grid = [1, 2, 3, 4, 5];

  const selfPath = self.map((v, i) => point(i, n, v)).map((p) => `${p.x},${p.y}`).join(" ");
  const avgPath = avg.map((v, i) => point(i, n, v)).map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 100 104" className="w-full">
      {/* grid rings */}
      {grid.map((g) => (
        <polygon
          key={g}
          points={Array.from({ length: n }, (_, i) => {
            const p = axisPoint(i, n, g / MAX);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="0.4"
        />
      ))}
      {/* spokes + labels */}
      {labels.map((label, i) => {
        const a = axisPoint(i, n);
        const l = axisPoint(i, n, 1.18);
        return (
          <g key={label}>
            <line x1={CX} y1={CY} x2={a.x} y2={a.y} stroke="#e2e8f0" strokeWidth="0.4" />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="4"
              fill="#475569"
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* team average (behind) */}
      <polygon points={avgPath} fill="#f9731633" stroke="#f97316" strokeWidth="0.8" />
      {/* self */}
      <polygon points={selfPath} fill="#4f46e533" stroke="#4f46e5" strokeWidth="1" />
    </svg>
  );
}
