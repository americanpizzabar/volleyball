"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/firebase/useCollection";
import { journalsQuery, practicesQuery } from "@/lib/firebase/db";
import { limit } from "firebase/firestore";
import type { JournalEntry, Practice } from "@/lib/types";
import { FullScreenLoader } from "@/components/ui";

export default function Dashboard() {
  const { profile, team } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";
  const isStaff = isCoach || profile?.role === "manager";

  const { data: practices, loading } = useCollection<Practice>(
    () => (teamId ? practicesQuery(teamId, limit(1)) : null),
    [teamId],
  );
  const { data: journals } = useCollection<JournalEntry>(
    () => (teamId ? journalsQuery(teamId) : null),
    [teamId],
  );

  if (loading) return <FullScreenLoader />;
  const latest = practices[0];
  const myJournals = journals.filter((j) => j.authorId === profile?.uid);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          こんにちは、{profile?.displayName}さん 🏐
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {isCoach ? "今日のメニューを共有しましょう。" : "今日の練習を予習しよう。"}
        </p>
      </div>

      {/* 今日のメニューと意図 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">最新の練習メニュー</h2>
          <Link href="/app/practices" className="text-xs font-semibold text-brand-600">
            すべて見る →
          </Link>
        </div>
        {latest ? (
          <Link href={`/app/practices/${latest.id}`} className="card block transition hover:ring-brand-300">
            <div className="flex items-center justify-between">
              <span className="chip bg-accent-500/15 text-accent-600">{latest.date}</span>
              {latest.tacticIds?.length > 0 && (
                <span className="chip bg-brand-100 text-brand-700">
                  ローテ図 {latest.tacticIds.length}
                </span>
              )}
            </div>
            <h3 className="mt-2 font-bold text-slate-900">{latest.title}</h3>
            {latest.theme && (
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">テーマ:</span> {latest.theme}
              </p>
            )}
          </Link>
        ) : (
          <div className="card text-sm text-slate-500">
            まだ練習メニューがありません。
            {isCoach && (
              <Link href="/app/practices/new" className="ml-1 font-semibold text-brand-600">
                作成する
              </Link>
            )}
          </div>
        )}
      </section>

      {/* クイックアクション */}
      <section className="grid grid-cols-2 gap-3">
        {isCoach && (
          <>
            <QuickAction href="/app/practices/new" emoji="📝" label="メニュー作成" />
            <QuickAction href="/app/tactics/new" emoji="🏐" label="ローテ図作成" />
          </>
        )}
        {isStaff && <QuickAction href="/app/stats" emoji="📊" label="スタッツ記録" />}
        <QuickAction href="/app/tactics" emoji="🎬" label="ローテを予習" />
        <QuickAction href="/app/journal/new" emoji="✍️" label="日誌を書く" />
        <QuickAction href="/app/requests" emoji="💡" label="要望・投票" />
      </section>

      {/* 自分の日誌 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            {isCoach ? "部員の振り返り日誌" : "自分の振り返り"}
          </h2>
          <Link href="/app/journal" className="text-xs font-semibold text-brand-600">
            すべて見る →
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          {isCoach
            ? `これまでに ${journals.length} 件の日誌が投稿されています。`
            : `あなたはこれまで ${myJournals.length} 件の振り返りを書きました。`}
        </p>
      </section>

      {team && (
        <p className="pt-2 text-center text-xs text-slate-400">
          チーム「{team.name}」
        </p>
      )}
    </div>
  );
}

function QuickAction({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      className="card flex flex-col items-center gap-1.5 py-5 text-center transition hover:ring-brand-300"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </Link>
  );
}
