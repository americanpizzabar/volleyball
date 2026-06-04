"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/lib/firebase/useDoc";
import { deletePractice, getTactics } from "@/lib/firebase/db";
import TacticViewer from "@/components/tactics/TacticViewer";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";
import type { Practice, Tactic } from "@/lib/types";

export default function PracticeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isCoach = profile?.role === "coach";
  const { data: practice, loading } = useDoc<Practice>("practices", params.id);
  const [tactics, setTactics] = useState<Tactic[]>([]);

  useEffect(() => {
    if (practice?.tacticIds?.length) {
      getTactics(practice.tacticIds).then(setTactics);
    } else {
      setTactics([]);
    }
  }, [practice?.tacticIds]);

  if (loading) return <FullScreenLoader />;
  if (!practice) return <EmptyState icon="🔍" title="メニューが見つかりません" />;

  async function handleDelete() {
    if (!confirm("このメニューを削除しますか？")) return;
    await deletePractice(params.id);
    router.replace("/app/practices");
  }

  return (
    <div className="space-y-4">
      <PageHeader title={practice.title} subtitle={practice.date} />

      {practice.theme && (
        <div className="card">
          <p className="text-xs font-semibold text-accent-600">今日のテーマ</p>
          <p className="mt-1 text-base font-bold text-slate-900">{practice.theme}</p>
        </div>
      )}

      {practice.intent && (
        <div className="card">
          <p className="text-xs font-semibold text-slate-500">意図・ねらい</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{practice.intent}</p>
        </div>
      )}

      {practice.menu && (
        <div className="card">
          <p className="text-xs font-semibold text-slate-500">メニュー</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{practice.menu}</p>
        </div>
      )}

      {tactics.map((t) => (
        <div key={t.id} className="card">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">🏐 {t.title}</p>
            <Link href={`/app/tactics/${t.id}`} className="text-xs font-semibold text-brand-600">
              詳細 →
            </Link>
          </div>
          <TacticViewer tactic={t} />
        </div>
      ))}

      <Link
        href={`/app/journal/new?practiceId=${practice.id}`}
        className="btn-accent w-full py-3"
      >
        ✍️ この練習の振り返りを書く
      </Link>

      {isCoach && (
        <button onClick={handleDelete} className="btn-danger w-full">
          メニューを削除
        </button>
      )}

      <Link href="/app/practices" className="block text-center text-sm text-slate-400">
        ← 一覧に戻る
      </Link>
    </div>
  );
}
