"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { getTeamMembers, skillSheetsByTeamQuery, teamStatsQuery } from "@/lib/db";
import { recentForm, type StatEvent } from "@/lib/stats";
import { POSITION_LABELS, type SkillSheet, type UserProfile } from "@/lib/types";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

const FORM_THRESHOLD = 3;

export default function RosterPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    getTeamMembers(teamId).then((m) => {
      setMembers(m as UserProfile[]);
      setLoading(false);
    });
  }, [teamId]);

  const { data: sheets } = useCollection<SkillSheet>(
    () => (teamId ? skillSheetsByTeamQuery(teamId) : null),
    [teamId],
  );
  const { data: events } = useCollection<StatEvent>(
    () => (teamId ? teamStatsQuery(teamId) : null),
    [teamId],
  );

  const powerByUid = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sheets) {
      m[s.userId] = Object.values(s.self ?? {}).reduce((a, b) => a + b, 0);
    }
    return m;
  }, [sheets]);

  const form = useMemo(() => recentForm(events), [events]);
  const maxPower = Math.max(1, ...Object.values(powerByUid));

  const players = useMemo(
    () =>
      members
        .filter((m) => m.role === "player")
        .sort((a, b) => (b.uid in form ? form[b.uid] : 0) - (a.uid in form ? form[a.uid] : 0) || (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
    [members, form],
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader title="チーム・ステータス" subtitle="好調な選手は青いオーラで発光" />

      {players.length === 0 ? (
        <EmptyState icon="👥" title="部員がいません" description="招待コード/QRで部員を集めましょう。" />
      ) : (
        <div className="space-y-3">
          {players.map((p) => {
            const power = powerByUid[p.uid] ?? 0;
            const formScore = form[p.uid] ?? 0;
            const inForm = formScore >= FORM_THRESHOLD;
            return (
              <Link
                key={p.uid}
                href="/app/portfolio"
                className="card flex items-center gap-4 transition hover:ring-brand-300"
              >
                <div
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black text-white ${
                    inForm ? "bg-blue-500 aura" : "bg-brand-500"
                  }`}
                >
                  {p.jerseyNumber ?? p.displayName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-slate-900">{p.displayName}</p>
                    {inForm && (
                      <span className="chip bg-blue-100 text-blue-700">🔥 絶好調</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.position ? POSITION_LABELS[p.position] : "ポジション未設定"}
                  </p>
                  {/* power bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                        style={{ width: `${(power / maxPower) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{power}pt</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        総合パワー＝スキル自己評価の合計。直近スタッツが好調だと🔥＋オーラ。
      </p>
    </div>
  );
}
