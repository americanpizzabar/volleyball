"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { teamStatsQuery } from "@/lib/db";
import StatsTable from "@/components/stats/StatsTable";
import {
  aggregate,
  fmtPct,
  killRate,
  receptionRate,
  type PlayerStats,
  type StatEvent,
} from "@/lib/stats";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

export default function TotalsPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;

  const { data: events, loading } = useCollection<StatEvent>(
    () => (teamId ? teamStatsQuery(teamId) : null),
    [teamId],
  );

  const players = useMemo(() => aggregate(events), [events]);

  if (loading) return <FullScreenLoader />;

  if (players.length === 0) {
    return (
      <div>
        <PageHeader title="通算成績" subtitle="個人・チームの累計スタッツ" />
        <EmptyState
          icon="🏆"
          title="まだ通算データがありません"
          description="試合でスタッツを記録すると、ここに累計成績が表示されます。"
          action={
            <Link href="/app/stats" className="btn-primary mt-2">
              試合一覧へ
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="通算成績" subtitle="個人・チームの累計スタッツ" />

      <div className="grid grid-cols-1 gap-3">
        <Leaderboard
          title="🎯 サービスエース王"
          players={players}
          value={(p) => p.serve.ace}
          format={(v) => `${v}本`}
        />
        <Leaderboard
          title="🏐 スパイク決定数"
          players={players}
          value={(p) => p.spike.kill}
          format={(v) => `${v}本`}
        />
        <Leaderboard
          title="🧱 ブロック決定数"
          players={players}
          value={(p) => p.block.kill}
          format={(v) => `${v}本`}
        />
        <Leaderboard
          title="🎖 スパイク決定率（5本以上）"
          players={players.filter((p) => p.spike.total >= 5)}
          value={(p) => killRate(p) ?? 0}
          format={(v) => fmtPct(v)}
        />
        <Leaderboard
          title="🤲 レセプション返球率（5本以上）"
          players={players.filter((p) => p.reception.total >= 5)}
          value={(p) => receptionRate(p) ?? 0}
          format={(v) => fmtPct(v)}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-700">全選手の累計</h2>
        <StatsTable players={players} />
      </div>

      <Link href="/app/stats" className="block text-center text-sm text-slate-400">
        ← スタッツに戻る
      </Link>
    </div>
  );
}

function Leaderboard({
  title,
  players,
  value,
  format,
}: {
  title: string;
  players: PlayerStats[];
  value: (p: PlayerStats) => number;
  format: (v: number) => string;
}) {
  const ranked = [...players]
    .map((p) => ({ p, v: value(p) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="card">
      <p className="mb-2 text-sm font-bold text-slate-800">{title}</p>
      <ul className="space-y-1.5">
        {ranked.map((x, i) => (
          <li key={x.p.playerId} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-700">
              <span>{medals[i]}</span>
              <span className="font-bold text-brand-700">{x.p.jersey ?? "—"}</span>
              {x.p.playerName}
            </span>
            <span className="text-sm font-bold text-slate-900">{format(x.v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
