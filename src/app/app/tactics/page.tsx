"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { tacticsQuery } from "@/lib/db";
import type { Tactic } from "@/lib/types";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

export default function TacticsListPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";

  const { data: tactics, loading } = useCollection<Tactic>(
    () => (teamId ? tacticsQuery(teamId) : null),
    [teamId],
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader
        title="ローテ・配置図"
        subtitle="タップしてアニメーションで予習"
        action={
          isCoach ? (
            <Link href="/app/tactics/new" className="btn-primary px-3 py-2 text-xs">
              ＋ 作成
            </Link>
          ) : undefined
        }
      />

      <Link
        href="/app/tactics/rotation"
        className="card mb-4 flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 text-white transition hover:opacity-95"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-bold">ローテシミュレーター</p>
            <p className="text-xs text-white/80">かぶり(反則)を自動判定・交代もできる</p>
          </div>
        </div>
        <span className="text-2xl text-white/70">›</span>
      </Link>

      <Link
        href="/app/tactics/library"
        className="card mb-4 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white transition hover:opacity-95"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <p className="font-bold">プロ戦術ライブラリ</p>
            <p className="text-xs text-white/80">シンクロ攻撃・時間差・ブロード等をアニメで予習</p>
          </div>
        </div>
        <span className="text-2xl text-white/70">›</span>
      </Link>

      {tactics.length === 0 ? (
        <EmptyState
          icon="🏐"
          title="まだローテ図がありません"
          description={
            isCoach
              ? "配置図とアニメーションを作って部員に共有しましょう。"
              : "顧問が配置図を追加するとここに表示されます。"
          }
          action={
            isCoach ? (
              <Link href="/app/tactics/new" className="btn-primary mt-2">
                最初のローテ図を作る
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {tactics.map((t) => (
            <Link
              key={t.id}
              href={`/app/tactics/${t.id}`}
              className="card flex items-center justify-between transition hover:ring-brand-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="chip bg-brand-100 text-brand-700">ローテ{t.rotation}</span>
                  <span className="chip bg-slate-100 text-slate-500">
                    {t.keyframes?.length ?? 0} コマ
                  </span>
                </div>
                <h3 className="mt-1.5 font-bold text-slate-900">{t.title}</h3>
                {t.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{t.description}</p>
                )}
              </div>
              <span className="text-2xl text-slate-300">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
