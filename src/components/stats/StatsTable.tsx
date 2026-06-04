"use client";

import {
  attackEfficiency,
  fmtPct,
  killRate,
  receptionRate,
  type PlayerStats,
} from "@/lib/stats";

/** Per-player summary table for a set / match. Horizontally scrollable. */
export default function StatsTable({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        まだ記録がありません。上の入力で記録を始めましょう。
      </p>
    );
  }

  const sorted = [...players].sort((a, b) => (a.jersey ?? 999) - (b.jersey ?? 999));

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="sticky left-0 bg-white px-3 py-2 text-left font-semibold">選手</th>
            <Th>打数</Th>
            <Th>決定</Th>
            <Th>決定率</Th>
            <Th>効果率</Th>
            <Th>Sエース</Th>
            <Th>レセ返球</Th>
            <Th>ブロック</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.playerId} className="border-b border-slate-100 last:border-0">
              <td className="sticky left-0 bg-white px-3 py-2.5 text-left font-medium text-slate-800 whitespace-nowrap">
                <span className="mr-1 font-bold text-brand-700">{p.jersey ?? "—"}</span>
                {p.playerName}
              </td>
              <Td>{p.spike.total || "—"}</Td>
              <Td>{p.spike.kill || "—"}</Td>
              <Td strong>{fmtPct(killRate(p))}</Td>
              <Td>{fmtPct(attackEfficiency(p))}</Td>
              <Td>{p.serve.ace || "—"}</Td>
              <Td>{fmtPct(receptionRate(p))}</Td>
              <Td>{p.block.kill || "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2.5 py-2 text-center font-semibold whitespace-nowrap">{children}</th>;
}
function Td({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td
      className={`px-2.5 py-2.5 text-center whitespace-nowrap ${
        strong ? "font-bold text-slate-900" : "text-slate-600"
      }`}
    >
      {children}
    </td>
  );
}
