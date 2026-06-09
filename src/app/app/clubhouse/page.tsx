"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import {
  getTeamMembers,
  journalsQuery,
  matchesQuery,
  nutritionLogsQuery,
} from "@/lib/db";
import type { JournalEntry, Match, NutritionLog, UserProfile } from "@/lib/types";
import { FullScreenLoader, PageHeader } from "@/components/ui";

const TIERS = [
  { name: "ボロ部室", min: 0, bg: "from-stone-300 to-stone-400", items: ["🧹", "📦"] },
  { name: "ふつうの部室", min: 60, bg: "from-amber-200 to-orange-300", items: ["🧹", "🪑", "🏐"] },
  { name: "きれいな部室", min: 180, bg: "from-emerald-200 to-teal-300", items: ["🪑", "🏐", "🛋️", "🪴"] },
  { name: "強化合宿所", min: 420, bg: "from-sky-300 to-indigo-300", items: ["🛋️", "🪴", "🏐", "🥤", "🏆"] },
  { name: "プロ・トレセン", min: 800, bg: "from-fuchsia-400 to-amber-300", items: ["🏆", "🥤", "💪", "🏅", "🏐", "✨"] },
];

export default function ClubhousePage() {
  const { profile, team } = useAuth();
  const teamId = profile?.teamId ?? null;

  const [memberCount, setMemberCount] = useState(1);
  useEffect(() => {
    if (!teamId) return;
    getTeamMembers(teamId).then((m) => setMemberCount(Math.max(1, (m as UserProfile[]).length)));
  }, [teamId]);

  const { data: nutrition, loading: l1 } = useCollection<NutritionLog>(
    () => (teamId ? nutritionLogsQuery(teamId) : null),
    [teamId],
  );
  const { data: journals, loading: l2 } = useCollection<JournalEntry>(
    () => (teamId ? journalsQuery(teamId) : null),
    [teamId],
  );
  const { data: matches, loading: l3 } = useCollection<Match>(
    () => (teamId ? matchesQuery(teamId) : null),
    [teamId],
  );

  const score = useMemo(
    () => nutrition.length * 3 + journals.length * 5 + matches.length * 25,
    [nutrition, journals, matches],
  );

  const tierIdx = TIERS.reduce((acc, t, i) => (score >= t.min ? i : acc), 0);
  const tier = TIERS[tierIdx];
  const next = TIERS[tierIdx + 1];
  const progress = next ? Math.min(100, ((score - tier.min) / (next.min - tier.min)) * 100) : 100;

  if (l1 || l2 || l3) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader title="デジタル部室" subtitle={team?.name} />

      {/* room */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${tier.bg} p-4 shadow`} style={{ minHeight: 220 }}>
        <div className="flex items-center justify-between">
          <span className="chip bg-white/80 font-black text-slate-700">Lv.{tierIdx + 1}</span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-slate-800">{tier.name}</span>
        </div>

        {/* furniture */}
        <div className="mt-6 flex flex-wrap items-end justify-center gap-3">
          {tier.items.map((it, i) => (
            <span key={i} className="text-5xl drop-shadow-sm" style={{ transform: `translateY(${(i % 2) * -8}px)` }}>
              {it}
            </span>
          ))}
        </div>
        {/* members as avatars */}
        <div className="mt-6 flex justify-center -space-x-2">
          {Array.from({ length: Math.min(memberCount, 8) }).map((_, i) => (
            <span key={i} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm ring-2 ring-white">🏐</span>
          ))}
        </div>
      </div>

      {/* progress */}
      <div className="card mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>部室ランク {tierIdx + 1} / {TIERS.length}</span>
          <span>{next ? `次まで ${next.min - score}pt` : "MAX！"}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          活動ポイント <b className="text-slate-700">{score}</b>
          （食事+3 / 日誌+5 / 試合+25）
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="食事記録" value={nutrition.length} />
        <Stat label="日誌" value={journals.length} />
        <Stat label="試合" value={matches.length} />
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        みんなの食事・日誌・試合が増えるほど、部室がプロ仕様に進化します。
      </p>
      <Link href="/app" className="mt-4 block text-center text-sm text-slate-400">← ホームに戻る</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card py-3">
      <p className="text-xl font-black text-brand-700">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
