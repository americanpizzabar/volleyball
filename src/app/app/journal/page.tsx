"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/firebase/useCollection";
import { deleteJournal, journalsQuery } from "@/lib/firebase/db";
import type { JournalEntry } from "@/lib/types";
import { ConditionBadge, EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";

function formatTime(ms?: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function JournalListPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";

  const { data: journals, loading } = useCollection<JournalEntry>(
    () => (teamId ? journalsQuery(teamId) : null),
    [teamId],
  );

  const [filter, setFilter] = useState<string>("all");

  const authors = useMemo(() => {
    const map = new Map<string, string>();
    journals.forEach((j) => map.set(j.authorId, j.authorName));
    return [...map.entries()];
  }, [journals]);

  if (loading) return <FullScreenLoader />;

  const visible = isCoach
    ? filter === "all"
      ? journals
      : journals.filter((j) => j.authorId === filter)
    : journals.filter((j) => j.authorId === profile?.uid);

  return (
    <div>
      <PageHeader
        title="振り返り日誌"
        subtitle={isCoach ? "部員の振り返りを一覧で確認" : "自分の振り返り"}
        action={
          <Link href="/app/journal/new" className="btn-primary px-3 py-2 text-xs">
            ＋ 書く
          </Link>
        }
      />

      {isCoach && authors.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            全員
          </FilterChip>
          {authors.map(([id, name]) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)}>
              {name}
            </FilterChip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon="✍️"
          title="まだ日誌がありません"
          description="練習の振り返りを書いて成長を記録しよう。"
          action={
            <Link href="/app/journal/new" className="btn-primary mt-2">
              日誌を書く
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((j) => (
            <div key={j.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCoach && (
                    <span className="font-semibold text-slate-800">{j.authorName}</span>
                  )}
                  <ConditionBadge value={j.condition} />
                </div>
                <span className="text-xs text-slate-400">{formatTime(j.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-brand-600">{j.practiceTitle}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{j.content}</p>
              {j.authorId === profile?.uid && (
                <button
                  onClick={() => {
                    if (confirm("この日誌を削除しますか？")) deleteJournal(j.id);
                  }}
                  className="mt-2 text-xs text-slate-400 hover:text-red-500"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip shrink-0 ring-1 transition ${
        active
          ? "bg-brand-600 text-white ring-brand-600"
          : "bg-white text-slate-600 ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
