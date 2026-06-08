"use client";

import { useMemo } from "react";
import { useCollection } from "@/lib/useCollection";
import { teamStatsQuery } from "@/lib/db";
import { aggregate, type StatEvent } from "@/lib/stats";
import { benchmarksForPosition, type Benchmark } from "@/lib/benchmarks";
import type { Position } from "@/lib/types";

export default function ProBenchmark({
  targetUid,
  teamId,
  position,
}: {
  targetUid: string;
  teamId: string;
  position: Position | null;
}) {
  const { data: events } = useCollection<StatEvent>(
    () => teamStatsQuery(teamId),
    [teamId],
  );

  const stats = useMemo(() => {
    const mine = events.filter((e) => e.playerId === targetUid);
    return aggregate(mine)[0] ?? null;
  }, [events, targetUid]);

  const metrics = benchmarksForPosition(position);

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-br from-slate-900 to-brand-700 text-white">
        <p className="text-sm font-bold">🏆 プロ・ベンチマーク</p>
        <p className="mt-1 text-xs text-white/80">
          あなたのスタッツを <span className="font-bold">Vリーグ平均</span>・
          <span className="font-bold text-amber-300">代表トップ</span> の参考値と比較。
          基準を「県大会」ではなく「プロ」に。
        </p>
      </div>

      {!stats && (
        <p className="card text-sm text-slate-500">
          まだ試合スタッツがありません。試合で記録すると、ここにプロ比較が表示されます。
        </p>
      )}

      {metrics.map((b) => (
        <MetricMeter key={b.key} b={b} value={stats ? b.value(stats) : null} />
      ))}

      <p className="text-center text-[11px] text-slate-400">
        ※ ベンチマークは公開統計に基づく概算の参考値です。
      </p>
    </div>
  );
}

function MetricMeter({ b, value }: { b: Benchmark; value: number | null }) {
  const max = b.isCount ? Math.max(b.max, value ?? 0) : b.max;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  // ミス率など「低いほど良い」指標は serveErr のみ。色判定に使用。
  const lowerBetter = b.key === "serveErr";
  const good =
    value != null && b.national != null
      ? lowerBetter
        ? value <= b.national
        : value >= b.national
      : false;
  const mid =
    value != null && b.vLeague != null
      ? lowerBetter
        ? value <= b.vLeague
        : value >= b.vLeague
      : false;

  const barColor = good ? "bg-amber-400" : mid ? "bg-emerald-500" : "bg-brand-500";

  return (
    <div className="card">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{b.label}</span>
        <span className="text-sm font-black text-slate-900">
          {value == null ? "—" : b.unit === "%" ? `${Math.round(value)}%` : `${value}本`}
        </span>
      </div>

      <div className="relative h-3 w-full rounded-full bg-slate-100">
        {value != null && (
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all`}
            style={{ width: pct(value) }}
          />
        )}
        {/* benchmark markers */}
        {b.vLeague != null && (
          <Marker pos={pct(b.vLeague)} color="#94a3b8" title={`Vリーグ平均 ${b.vLeague}${b.unit}`} />
        )}
        {b.national != null && (
          <Marker pos={pct(b.national)} color="#f59e0b" title={`代表トップ ${b.national}${b.unit}`} />
        )}
      </div>

      {(b.vLeague != null || b.national != null) && (
        <div className="mt-1 flex gap-3 text-[11px] text-slate-500">
          {b.vLeague != null && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-slate-400" />Vリーグ平均 {b.vLeague}
              {b.unit}
            </span>
          )}
          {b.national != null && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-amber-500" />代表トップ {b.national}
              {b.unit}
            </span>
          )}
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-600">{b.advice(value)}</p>
    </div>
  );
}

function Marker({ pos, color, title }: { pos: string; color: string; title: string }) {
  return (
    <span
      title={title}
      className="absolute inset-y-[-2px] w-0.5 rounded"
      style={{ left: pos, backgroundColor: color }}
    />
  );
}
