"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { matchesQuery } from "@/lib/db";
import type { Match } from "@/lib/types";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

export default function StatsListPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isStaff = profile?.role === "coach" || profile?.role === "manager";

  const { data: matches, loading } = useCollection<Match>(
    () => (teamId ? matchesQuery(teamId) : null),
    [teamId],
  );

  const sorted = useMemo(
    () =>
      [...matches].sort((a, b) =>
        b.date === a.date
          ? (b.createdAt ?? 0) - (a.createdAt ?? 0)
          : b.date.localeCompare(a.date),
      ),
    [matches],
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader
        title="スタッツ"
        subtitle="タップ3回で記録、リアルタイム集計"
        action={
          isStaff ? (
            <Link href="/app/stats/new" className="btn-primary px-3 py-2 text-xs">
              ＋ 試合
            </Link>
          ) : undefined
        }
      />

      <Link
        href="/app/stats/totals"
        className="card mb-4 flex items-center justify-between transition hover:ring-brand-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-slate-900">通算成績ランキング</p>
            <p className="text-xs text-slate-500">エース王・決定率など個人成績</p>
          </div>
        </div>
        <span className="text-2xl text-slate-300">›</span>
      </Link>

      {sorted.length === 0 ? (
        <EmptyState
          icon="📊"
          title="まだ試合がありません"
          description={
            isStaff
              ? "試合を作成して、スタッツの記録を始めましょう。"
              : "マネージャー・顧問が試合を作成するとここに表示されます。"
          }
          action={
            isStaff ? (
              <Link href="/app/stats/new" className="btn-primary mt-2">
                試合を作成
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((m) => {
            const won = m.sets.filter((s) => s.us > s.them).length;
            const lost = m.sets.filter((s) => s.them > s.us).length;
            return (
              <Link
                key={m.id}
                href={`/app/stats/${m.id}`}
                className="card block transition hover:ring-brand-300"
              >
                <div className="flex items-center justify-between">
                  <span className="chip bg-accent-500/15 text-accent-600">{m.date}</span>
                  {m.status === "live" ? (
                    <span className="chip bg-red-100 text-red-600">● 記録中</span>
                  ) : (
                    <span className="chip bg-slate-100 text-slate-500">終了</span>
                  )}
                </div>
                <h3 className="mt-2 font-bold text-slate-900">vs {m.opponent}</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {m.tournament && <span className="mr-2">{m.tournament}</span>}
                  セットカウント {won}-{lost}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
