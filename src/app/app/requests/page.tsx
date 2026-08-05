"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import {
  deleteRequest,
  requestsQuery,
  setRequestStatus,
  toggleVote,
} from "@/lib/db";
import {
  REQUEST_CATEGORY_LABELS,
  REQUEST_STATUS_LABELS,
  type FeatureRequest,
  type RequestCategory,
  type RequestStatus,
} from "@/lib/types";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

const CATEGORY_STYLE: Record<RequestCategory, string> = {
  feature: "bg-brand-100 text-brand-700",
  share: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-600",
};
const STATUS_STYLE: Record<RequestStatus, string> = {
  open: "bg-amber-100 text-amber-700",
  planned: "bg-blue-100 text-blue-700",
  done: "bg-slate-200 text-slate-500",
};

export default function RequestsPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";

  const { data: requests, loading, refresh } = useCollection<FeatureRequest>(
    () => (teamId ? requestsQuery(teamId) : null),
    [teamId],
  );

  const [tab, setTab] = useState<"all" | RequestCategory>("all");

  // Most-voted first within the selected category.
  const sorted = useMemo(() => {
    const filtered =
      tab === "all" ? requests : requests.filter((r) => r.category === tab);
    return [...filtered].sort(
      (a, b) => (b.voters?.length ?? 0) - (a.voters?.length ?? 0),
    );
  }, [requests, tab]);

  if (loading) return <FullScreenLoader />;

  async function vote(r: FeatureRequest) {
    if (!profile) return;
    await toggleVote(r.id, profile.uid, r.voters?.includes(profile.uid) ?? false);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="要望・情報共有"
        subtitle="欲しい機能をリクエストして投票しよう"
        action={
          <Link href="/app/requests/new" className="btn-primary px-3 py-2 text-xs">
            ＋ 投稿
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", "feature", "share", "other"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chip shrink-0 ring-1 transition ${
              tab === t
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {t === "all" ? "すべて" : REQUEST_CATEGORY_LABELS[t]}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="💡"
          title="まだ投稿がありません"
          description="「サーブ練習を増やしたい」「アプリに〇〇が欲しい」など、自由に投稿しよう。"
          action={
            <Link href="/app/requests/new" className="btn-primary mt-2">
              最初の投稿をする
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => {
            const voted = profile ? r.voters?.includes(profile.uid) : false;
            const canDelete = isCoach || r.authorId === profile?.uid;
            return (
              <div key={r.id} className="card flex gap-3">
                <button
                  onClick={() => vote(r)}
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl ring-1 transition ${
                    voted
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                  aria-label="投票"
                >
                  <span className="text-lg leading-none">▲</span>
                  <span className="text-base font-bold leading-tight">
                    {r.voters?.length ?? 0}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`chip ${CATEGORY_STYLE[r.category]}`}>
                      {REQUEST_CATEGORY_LABELS[r.category]}
                    </span>
                    <span className={`chip ${STATUS_STYLE[r.status]}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <h3 className="mt-1 font-bold text-slate-900">{r.title}</h3>
                  {r.description && (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{r.authorName}</span>
                    {isCoach && (
                      <select
                        value={r.status}
                        onChange={(e) =>
                          setRequestStatus(r.id, e.target.value as RequestStatus).then(refresh)
                        }
                        className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600"
                      >
                        {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map(
                          (s) => (
                            <option key={s} value={s}>
                              {REQUEST_STATUS_LABELS[s]}
                            </option>
                          ),
                        )}
                      </select>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm("この投稿を削除しますか？")) deleteRequest(r.id).then(refresh);
                        }}
                        className="hover:text-red-500"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
