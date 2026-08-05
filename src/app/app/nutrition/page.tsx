"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { createNutritionLog, getTeamMembers, nutritionLogsQuery } from "@/lib/db";
import {
  FOODS,
  bossForWeek,
  bossMaxHp,
  mealPower,
  weekStart,
} from "@/lib/nutrition";
import type { NutritionLog, UserProfile } from "@/lib/types";
import Confetti from "@/components/Confetti";
import { playKill, playLevelUp } from "@/lib/sfx";
import { FullScreenLoader, PageHeader, Spinner } from "@/components/ui";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;

  const [memberCount, setMemberCount] = useState(1);
  useEffect(() => {
    if (!teamId) return;
    getTeamMembers(teamId).then((m) => setMemberCount(Math.max(1, (m as UserProfile[]).length)));
  }, [teamId]);

  const { data: logs, loading, refresh } = useCollection<NutritionLog>(
    () => (teamId ? nutritionLogsQuery(teamId) : null),
    [teamId],
  );

  const ws = weekStart();
  const boss = bossForWeek();
  const maxHp = bossMaxHp(memberCount);

  const weekLogs = useMemo(() => logs.filter((l) => l.date >= ws), [logs, ws]);
  const damage = useMemo(() => weekLogs.reduce((s, l) => s + l.power, 0), [weekLogs]);
  const hp = Math.max(0, maxHp - damage);
  const defeated = damage >= maxHp;

  const myPower = useMemo(
    () => weekLogs.filter((l) => l.userId === profile?.uid).reduce((s, l) => s + l.power, 0),
    [weekLogs, profile?.uid],
  );

  // 貢献ランキング
  const ranking = useMemo(() => {
    const map = new Map<string, { name: string; power: number }>();
    for (const l of weekLogs) {
      const cur = map.get(l.userId) ?? { name: l.userName, power: 0 };
      cur.power += l.power;
      map.set(l.userId, cur);
    }
    return [...map.values()].sort((a, b) => b.power - a.power).slice(0, 5);
  }, [weekLogs]);

  // meal logger
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ power: number; combo: string } | null>(null);
  const preview = useMemo(() => mealPower([...sel]), [sel]);

  function toggle(k: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }

  async function logMeal() {
    if (!profile?.teamId || sel.size === 0) return;
    setBusy(true);
    const { power, combo } = mealPower([...sel]);
    try {
      await createNutritionLog({
        teamId: profile.teamId,
        userId: profile.uid,
        userName: profile.displayName,
        date: today(),
        tags: [...sel],
        power,
        combo: combo?.label ?? "",
      });
      refresh(); // update boss HP, damage, my-contribution and ranking
      setFlash({ power, combo: combo?.label ?? "" });
      if (combo) playLevelUp();
      else playKill();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(combo ? [30, 30, 60] : 30);
      setTimeout(() => setFlash(null), 1600);
      setSel(new Set());
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  if (loading) return <FullScreenLoader />;

  return (
    <div className="space-y-4">
      <PageHeader title="マッスル・モンスター・バトル" subtitle="食事を記録してチームでボスを討伐！" />

      {/* boss card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-brand-700 p-4 text-white shadow">
        {(flash?.combo || defeated) && <Confetti />}
        <div className="flex items-center gap-3">
          <span className="text-5xl">{boss.emoji}</span>
          <div className="flex-1">
            <p className="text-xs text-white/70">今週のボス</p>
            <p className="text-lg font-black">{boss.name}</p>
          </div>
          {defeated && <span className="chip bg-amber-400 text-amber-900">討伐成功！</span>}
        </div>
        {/* HP bar */}
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span>HP</span>
            <span className="font-mono">{hp} / {maxHp}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${(hp / maxHp) * 100}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-white/80">
          チームの総攻撃力 <span className="font-bold">{damage}</span> ／ あなたの貢献{" "}
          <span className="font-bold text-amber-300">{myPower}</span>
        </p>
      </div>

      {/* meal logger */}
      <div className="card space-y-3">
        <p className="text-sm font-bold text-slate-700">食事を記録（食べたものをタップ）</p>
        <div className="grid grid-cols-3 gap-2">
          {FOODS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-3 ring-1 transition active:scale-95 ${
                sel.has(f.key) ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[11px] font-semibold">{f.label}</span>
              <span className={`text-[10px] ${sel.has(f.key) ? "text-white/80" : "text-slate-400"}`}>+{f.power}</span>
            </button>
          ))}
        </div>

        {sel.size > 0 && (
          <div className="rounded-xl bg-slate-50 p-2 text-center text-sm">
            攻撃力 <span className="font-black text-brand-700">{preview.power}</span>
            {preview.combo && (
              <span className="ml-2 chip bg-amber-100 text-amber-700">{preview.combo.label} ×{preview.combo.mult}</span>
            )}
          </div>
        )}

        <button onClick={logMeal} disabled={busy || sel.size === 0} className="btn-primary w-full">
          {busy ? <Spinner /> : "⚔ 攻撃！（食事を記録）"}
        </button>
      </div>

      {/* contribution ranking */}
      <div className="card">
        <p className="mb-2 text-sm font-bold text-slate-700">今週の貢献ランキング</p>
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-500">まだ記録がありません。最初の一撃を入れよう！</p>
        ) : (
          <ul className="space-y-1.5">
            {ranking.map((r, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <span>{["🥇", "🥈", "🥉", "4", "5"][i]}</span>
                  {r.name}
                </span>
                <span className="text-sm font-bold text-brand-700">{r.power}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* flash popup */}
      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
          <div className="rally-pop rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 px-6 py-3 text-center text-white shadow-lg">
            <p className="text-2xl font-black">-{flash.power} ダメージ！</p>
            {flash.combo && <p className="text-sm font-bold text-amber-200">{flash.combo}</p>}
          </div>
        </div>
      )}

      <Link href="/app" className="block text-center text-sm text-slate-400">← ホームに戻る</Link>
    </div>
  );
}
