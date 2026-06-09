"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import {
  createGachaPull,
  gachaPullsByUserQuery,
  journalsQuery,
  nutritionLogsQuery,
} from "@/lib/db";
import type { GachaPull, JournalEntry, NutritionLog } from "@/lib/types";
import {
  COIN_PER_JOURNAL,
  COIN_PER_NUTRITION,
  drawReward,
  GACHA_RARITY_STYLE,
  PULL_COST,
  REWARDS,
  type GachaReward,
} from "@/lib/gacha";
import Confetti from "@/components/Confetti";
import { playKill, playLevelUp } from "@/lib/sfx";
import { FullScreenLoader, PageHeader, Spinner } from "@/components/ui";

export default function GachaPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const uid = profile?.uid;

  const { data: journals, loading: l1 } = useCollection<JournalEntry>(
    () => (teamId ? journalsQuery(teamId) : null),
    [teamId],
  );
  const { data: nutrition, loading: l2 } = useCollection<NutritionLog>(
    () => (teamId ? nutritionLogsQuery(teamId) : null),
    [teamId],
  );
  const { data: pulls, loading: l3 } = useCollection<GachaPull>(
    () => (uid ? gachaPullsByUserQuery(uid) : null),
    [uid],
  );

  const earned =
    journals.filter((j) => j.authorId === uid).length * COIN_PER_JOURNAL +
    nutrition.filter((n) => n.userId === uid).length * COIN_PER_NUTRITION;
  const coins = Math.max(0, earned - pulls.length * PULL_COST);

  const obtained = useMemo(() => {
    const set = new Set(pulls.map((p) => p.rewardKey));
    return set;
  }, [pulls]);

  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<GachaReward | null>(null);

  async function pull() {
    if (!profile?.teamId || coins < PULL_COST || busy) return;
    setBusy(true);
    setReveal(null);
    const reward = drawReward();
    try {
      await createGachaPull({
        teamId: profile.teamId,
        userId: profile.uid,
        rewardKey: reward.key,
        rarity: reward.rarity,
      });
      setTimeout(() => {
        setReveal(reward);
        if (reward.rarity === "UR" || reward.rarity === "SR") playLevelUp();
        else playKill();
        if (typeof navigator !== "undefined" && navigator.vibrate)
          navigator.vibrate(reward.rarity === "UR" ? [40, 40, 120] : 30);
        setBusy(false);
      }, 350);
    } catch {
      setBusy(false);
    }
  }

  if (l1 || l2 || l3) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader title="ミラクル・プレイ・ガチャ" subtitle="日誌・食事でコインを貯めて回そう！" />

      {/* coin balance */}
      <div className="card flex items-center justify-between bg-gradient-to-r from-amber-400 to-orange-400 text-white">
        <span className="font-bold">🪙 コイン</span>
        <span className="text-2xl font-black">{coins}</span>
      </div>
      <p className="mt-1 text-center text-xs text-slate-500">
        日誌+{COIN_PER_JOURNAL} / 食事記録+{COIN_PER_NUTRITION}　・　1回 {PULL_COST}コイン
      </p>

      {/* reveal stage */}
      <div className="relative my-4 grid min-h-[12rem] place-items-center rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-4">
        {reveal && (reveal.rarity === "UR" || reveal.rarity === "SR") && <Confetti />}
        {reveal ? (
          <div className="mx-auto w-40">
            <RewardCard reward={reveal} big />
          </div>
        ) : (
          <p className="text-sm text-white/70">{busy ? "抽選中…" : "ガチャを回そう！"}</p>
        )}
      </div>

      <button onClick={pull} disabled={busy || coins < PULL_COST} className="btn-accent w-full py-3">
        {busy ? <Spinner /> : coins < PULL_COST ? `コイン不足（あと${PULL_COST - coins}）` : `🎴 ガチャを回す（${PULL_COST}）`}
      </button>

      {/* collection */}
      <p className="mt-6 mb-2 text-sm font-bold text-slate-700">
        コレクション {obtained.size} / {REWARDS.length}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {REWARDS.map((r) => (
          <RewardCard key={r.key} reward={r} locked={!obtained.has(r.key)} />
        ))}
      </div>

      <Link href="/app" className="mt-6 block text-center text-sm text-slate-400">← ホームに戻る</Link>
    </div>
  );
}

function RewardCard({ reward, big, locked }: { reward: GachaReward; big?: boolean; locked?: boolean }) {
  const s = GACHA_RARITY_STYLE[reward.rarity];
  if (locked) {
    return (
      <div className="grid place-items-center rounded-xl bg-slate-100 p-2 text-center ring-1 ring-slate-200" style={{ minHeight: 92 }}>
        <span className="text-2xl text-slate-300">？</span>
        <span className="text-[10px] text-slate-400">{reward.rarity}</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.bg} p-2 text-center ring-2 ${s.ring} ${big ? "card-reveal" : ""}`}>
      {reward.rarity === "UR" && <div className="card-ur pointer-events-none absolute inset-0" />}
      <span className={`chip bg-white/70 text-[10px] font-black ${reward.rarity === "UR" ? "text-amber-600" : "text-slate-600"}`}>{reward.rarity}</span>
      <div className={big ? "text-5xl" : "text-2xl"}>{reward.emoji}</div>
      <p className={`font-bold text-slate-800 ${big ? "text-sm" : "text-[11px] leading-tight"}`}>{reward.title}</p>
      {big && <p className="mt-1 text-xs text-slate-600">{reward.text}</p>}
    </div>
  );
}
