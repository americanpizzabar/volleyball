"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { teamStatsQuery } from "@/lib/db";
import type { StatEvent } from "@/lib/stats";
import { buildCards, byRarity, RARITY_STYLE, type PlayCard } from "@/lib/cards";
import Confetti from "@/components/Confetti";
import { playKill, playLevelUp } from "@/lib/sfx";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

export default function CardsPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;

  const { data: events, loading } = useCollection<StatEvent>(
    () => (teamId ? teamStatsQuery(teamId) : null),
    [teamId],
  );

  const cards = useMemo(() => {
    const mine = events.filter((e) => e.playerId === profile?.uid);
    return buildCards(mine);
  }, [events, profile?.uid]);

  const sorted = useMemo(() => [...cards].sort(byRarity), [cards]);

  const [revealed, setRevealed] = useState<PlayCard | null>(null);

  function openPack() {
    if (cards.length === 0) return;
    const pick = cards[Math.floor(Math.random() * cards.length)];
    setRevealed(pick);
    if (pick.rarity === "UR" || pick.rarity === "SR") playLevelUp();
    else playKill();
  }

  if (loading) return <FullScreenLoader />;

  const urCount = cards.filter((c) => c.rarity === "UR").length;

  return (
    <div>
      <PageHeader title="プレーカード" subtitle={`コレクション ${cards.length}枚 ・ UR ${urCount}枚`} />

      {cards.length === 0 ? (
        <EmptyState
          icon="🃏"
          title="まだカードがありません"
          description="試合でスパイク決定・エース・ブロックなどを記録すると、自動でカード化されます。"
        />
      ) : (
        <>
          <button onClick={openPack} className="btn-accent mb-4 w-full py-3">
            🎴 パックを開封する
          </button>

          {/* reveal */}
          {revealed && (
            <div className="relative mb-4">
              {(revealed.rarity === "UR" || revealed.rarity === "SR") && <Confetti />}
              <div className="mx-auto max-w-[14rem]">
                <CardView card={revealed} big />
              </div>
            </div>
          )}

          {/* collection */}
          <p className="mb-2 text-sm font-bold text-slate-700">コレクション</p>
          <div className="grid grid-cols-3 gap-2">
            {sorted.map((c) => (
              <CardView key={c.id} card={c} />
            ))}
          </div>
        </>
      )}

      <Link href="/app" className="mt-6 block text-center text-sm text-slate-400">
        ← ホームに戻る
      </Link>
    </div>
  );
}

function CardView({ card, big }: { card: PlayCard; big?: boolean }) {
  const s = RARITY_STYLE[card.rarity];
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.bg} p-2 text-center ring-2 ${s.ring} ${
        big ? "card-reveal py-5" : ""
      }`}
    >
      {card.rarity === "UR" && <div className="card-ur pointer-events-none absolute inset-0" />}
      <div className="flex justify-between">
        <span className={`chip bg-white/70 text-[10px] font-black ${card.rarity === "UR" ? "text-amber-600" : "text-slate-600"}`}>
          {s.label}
        </span>
        <span className="text-[10px] font-bold text-slate-500">{card.jersey ?? ""}</span>
      </div>
      <div className={big ? "text-5xl" : "text-2xl"}>{card.emoji}</div>
      <p className={`font-bold text-slate-800 ${big ? "text-base" : "text-[11px] leading-tight"}`}>{card.title}</p>
      <p className="truncate text-[10px] text-slate-500">{card.playerName}</p>
    </div>
  );
}
