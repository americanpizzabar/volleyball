"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/lib/useDoc";
import { deleteTactic, mapTactic } from "@/lib/db";
import TacticViewer from "@/components/tactics/TacticViewer";
import { EmptyState, FullScreenLoader, PageHeader, Spinner } from "@/components/ui";
import type { Tactic } from "@/lib/types";

const Tactic3DViewer = dynamic(
  () => import("@/components/tactics/Tactic3DViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-100">
        <Spinner className="text-brand-600" />
      </div>
    ),
  },
);

export default function TacticDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isCoach = profile?.role === "coach";
  const { data: tactic, loading } = useDoc<Tactic>("tactics", params.id, mapTactic);
  const [view, setView] = useState<"2d" | "3d">("2d");

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

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {(["2d", "3d"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-xl py-2 text-sm font-semibold ring-1 transition ${
              view === v
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {v === "2d" ? "2D / 俯瞰" : "3D コート"}
          </button>
        ))}
      </div>

      {view === "2d" ? (
        <TacticViewer tactic={tactic} />
      ) : (
        <Tactic3DViewer tactic={tactic} />
      )}

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
