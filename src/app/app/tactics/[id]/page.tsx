"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/lib/firebase/useDoc";
import { deleteTactic } from "@/lib/firebase/db";
import TacticViewer from "@/components/tactics/TacticViewer";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";
import type { Tactic } from "@/lib/types";

export default function TacticDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isCoach = profile?.role === "coach";
  const { data: tactic, loading } = useDoc<Tactic>("tactics", params.id);

  if (loading) return <FullScreenLoader />;
  if (!tactic) {
    return (
      <EmptyState icon="🔍" title="ローテ図が見つかりません" />
    );
  }

  async function handleDelete() {
    if (!confirm("このローテ図を削除しますか？")) return;
    await deleteTactic(params.id);
    router.replace("/app/tactics");
  }

  return (
    <div>
      <PageHeader
        title={tactic.title}
        subtitle={`ローテ${tactic.rotation} ・ ${tactic.keyframes.length} コマ`}
      />

      <TacticViewer tactic={tactic} />

      {tactic.description && (
        <div className="card mt-4">
          <p className="text-xs font-semibold text-slate-500">ねらい・説明</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {tactic.description}
          </p>
        </div>
      )}

      {isCoach && (
        <div className="mt-5 flex gap-2">
          <Link href={`/app/tactics/${tactic.id}/edit`} className="btn-ghost flex-1">
            編集
          </Link>
          <button onClick={handleDelete} className="btn-danger flex-1">
            削除
          </button>
        </div>
      )}

      <Link href="/app/tactics" className="mt-4 block text-center text-sm text-slate-400">
        ← 一覧に戻る
      </Link>
    </div>
  );
}
