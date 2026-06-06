"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/lib/useDoc";
import { useCollection } from "@/lib/useCollection";
import {
  deleteMatch,
  deleteStat,
  getTeamMembers,
  mapMatch,
  matchStatsQuery,
  recordStat,
  updateMatch,
} from "@/lib/db";
import StatRecorder, { type RosterPlayer } from "@/components/stats/StatRecorder";
import CourtTapInput from "@/components/stats/CourtTapInput";
import ShotChart from "@/components/stats/ShotChart";
import StatsTable from "@/components/stats/StatsTable";
import { aggregate, resultLabel, SKILL_LABELS, type StatEvent } from "@/lib/stats";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";
import type { Match, UserProfile } from "@/lib/types";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "manager";

  const { data: match, loading } = useDoc<Match>("matches", params.id, mapMatch);
  const { data: events } = useCollection<StatEvent>(
    () => matchStatsQuery(params.id),
    [params.id],
  );
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [scope, setScope] = useState<"set" | "all">("set");
  const [inputMode, setInputMode] = useState<"button" | "court">("button");

  useEffect(() => {
    if (!match?.teamId) return;
    getTeamMembers(match.teamId).then((members) => {
      const players = (members as UserProfile[])
        .filter((m) => m.role === "player")
        .map((m) => ({ id: m.uid, name: m.displayName, jersey: m.jerseyNumber ?? null }))
        .sort((a, b) => (a.jersey ?? 999) - (b.jersey ?? 999));
      setRoster(players);
    });
  }, [match?.teamId]);

  const currentSet = match?.currentSet ?? 1;

  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [events],
  );
  const scoped = useMemo(
    () => (scope === "set" ? sorted.filter((e) => e.set === currentSet) : sorted),
    [sorted, scope, currentSet],
  );
  const aggregated = useMemo(() => aggregate(scoped), [scoped]);
  const recent = useMemo(() => [...sorted].reverse().slice(0, 6), [sorted]);

  if (loading) return <FullScreenLoader />;
  if (!match) return <EmptyState icon="🔍" title="試合が見つかりません" />;

  const setScore = match.sets[currentSet - 1] ?? { us: 0, them: 0 };

  async function changeScore(side: "us" | "them", delta: number) {
    if (!match) return;
    const sets = match.sets.map((s) => ({ ...s }));
    const cur = sets[currentSet - 1] ?? { us: 0, them: 0 };
    cur[side] = Math.max(0, cur[side] + delta);
    sets[currentSet - 1] = cur;
    await updateMatch(match.id, { sets });
  }

  async function nextSet() {
    if (!match) return;
    await updateMatch(match.id, {
      sets: [...match.sets, { us: 0, them: 0 }],
      currentSet: match.currentSet + 1,
    });
    setScope("set");
  }

  async function toggleFinish() {
    if (!match) return;
    await updateMatch(match.id, {
      status: match.status === "live" ? "finished" : "live",
    });
  }

  async function handleRecord(
    player: RosterPlayer,
    skill: StatEvent["skill"],
    result: string,
    x: number | null = null,
    y: number | null = null,
  ) {
    if (!match) return;
    await recordStat({
      teamId: match.teamId,
      matchId: match.id,
      set: currentSet,
      playerId: player.id,
      playerName: player.name,
      jersey: player.jersey,
      skill,
      result,
      x,
      y,
    });
  }

  async function handleDeleteMatch() {
    if (!confirm("この試合と記録を削除しますか？")) return;
    await deleteMatch(params.id);
    router.replace("/app/stats");
  }

  const setsWon = match.sets.filter((s) => s.us > s.them).length;
  const setsLost = match.sets.filter((s) => s.them > s.us).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`vs ${match.opponent}`}
        subtitle={`${match.date}${match.tournament ? " ・ " + match.tournament : ""}`}
      />

      {/* Scoreboard */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>第 {currentSet} セット</span>
          <span>セットカウント {setsWon} - {setsLost}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ScoreCell
            label="自チーム"
            score={setScore.us}
            color="text-brand-700"
            editable={isStaff && match.status === "live"}
            onInc={() => changeScore("us", 1)}
            onDec={() => changeScore("us", -1)}
          />
          <ScoreCell
            label={match.opponent}
            score={setScore.them}
            color="text-slate-700"
            editable={isStaff && match.status === "live"}
            onInc={() => changeScore("them", 1)}
            onDec={() => changeScore("them", -1)}
          />
        </div>
        {match.sets.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {match.sets.map((s, i) => (
              <span
                key={i}
                className={`chip ring-1 ${
                  i + 1 === currentSet
                    ? "bg-brand-50 text-brand-700 ring-brand-200"
                    : "bg-white text-slate-500 ring-slate-200"
                }`}
              >
                第{i + 1}S {s.us}-{s.them}
              </span>
            ))}
          </div>
        )}
        {isStaff && (
          <div className="mt-3 flex gap-2">
            {match.status === "live" && (
              <button onClick={nextSet} className="btn-ghost flex-1 text-xs">
                次のセットへ
              </button>
            )}
            <button onClick={toggleFinish} className="btn-ghost flex-1 text-xs">
              {match.status === "live" ? "試合終了" : "記録を再開"}
            </button>
          </div>
        )}
      </div>

      {/* Recorder (staff only, while live) */}
      {isStaff && match.status === "live" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setInputMode("button")}
              className={`rounded-xl py-2 text-sm font-semibold ring-1 transition ${
                inputMode === "button"
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              ボタン入力
            </button>
            <button
              onClick={() => setInputMode("court")}
              className={`rounded-xl py-2 text-sm font-semibold ring-1 transition ${
                inputMode === "court"
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              コート入力（2タッチ）
            </button>
          </div>
          {inputMode === "button" ? (
            <StatRecorder players={roster} onRecord={handleRecord} />
          ) : (
            <CourtTapInput
              players={roster}
              onRecord={(player, result, x, y) =>
                handleRecord(player, "spike", result, x, y)
              }
            />
          )}
        </div>
      )}

      {/* Recent events with undo */}
      {recent.length > 0 && isStaff && (
        <div className="card">
          <p className="mb-2 text-xs font-semibold text-slate-500">最近の記録（タップで取消）</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  if (confirm("この記録を取り消しますか？")) deleteStat(e.id);
                }}
                className="chip bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              >
                {e.jersey ?? ""}{e.jersey != null ? " " : ""}
                {SKILL_LABELS[e.skill]}/{resultLabel(e.skill, e.result)} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aggregation */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">集計</h2>
          <div className="flex gap-1.5">
            <ScopeChip active={scope === "set"} onClick={() => setScope("set")}>
              第{currentSet}セット
            </ScopeChip>
            <ScopeChip active={scope === "all"} onClick={() => setScope("all")}>
              試合全体
            </ScopeChip>
          </div>
        </div>
        <StatsTable players={aggregated} />
      </div>

      {/* Shot chart (court-tap spikes) */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-700">ショットチャート（スパイク落下地点）</h2>
        <ShotChart events={scoped} />
      </div>

      {isStaff && (
        <button onClick={handleDeleteMatch} className="btn-danger w-full">
          試合を削除
        </button>
      )}
      <Link href="/app/stats" className="block text-center text-sm text-slate-400">
        ← 一覧に戻る
      </Link>
    </div>
  );
}

function ScoreCell({
  label,
  score,
  color,
  editable,
  onInc,
  onDec,
}: {
  label: string;
  score: number;
  color: string;
  editable: boolean;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      <p className={`my-1 text-4xl font-black tabular-nums ${color}`}>{score}</p>
      {editable && (
        <div className="flex justify-center gap-2">
          <button
            onClick={onDec}
            className="h-9 w-9 rounded-full bg-white text-lg font-bold text-slate-400 ring-1 ring-slate-200 active:scale-95"
          >
            −
          </button>
          <button
            onClick={onInc}
            className="h-9 w-9 rounded-full bg-brand-600 text-lg font-bold text-white active:scale-95"
          >
            ＋
          </button>
        </div>
      )}
    </div>
  );
}

function ScopeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip ring-1 transition ${
        active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
