"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { practicesQuery } from "@/lib/db";
import type { Practice } from "@/lib/types";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

export default function PracticesListPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";

  const { data: practices, loading } = useCollection<Practice>(
    () => (teamId ? practicesQuery(teamId) : null),
    [teamId],
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader
        title="練習メニュー"
        subtitle="今日のテーマと意図を確認"
        action={
          isCoach ? (
            <Link href="/app/practices/new" className="btn-primary px-3 py-2 text-xs">
              ＋ 作成
            </Link>
          ) : undefined
        }
      />

      {practices.length === 0 ? (
        <EmptyState
          icon="📋"
          title="まだメニューがありません"
          description={
            isCoach
              ? "今日の練習テーマと配置図を共有しましょう。"
              : "顧問がメニューを追加するとここに表示されます。"
          }
          action={
            isCoach ? (
              <Link href="/app/practices/new" className="btn-primary mt-2">
                メニューを作成
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {practices.map((p) => (
            <Link
              key={p.id}
              href={`/app/practices/${p.id}`}
              className="card block transition hover:ring-brand-300"
            >
              <div className="flex items-center justify-between">
                <span className="chip bg-accent-500/15 text-accent-600">{p.date}</span>
                {p.tacticIds?.length > 0 && (
                  <span className="chip bg-brand-100 text-brand-700">
                    ローテ {p.tacticIds.length}
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-bold text-slate-900">{p.title}</h3>
              {p.theme && (
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-semibold">テーマ:</span> {p.theme}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
