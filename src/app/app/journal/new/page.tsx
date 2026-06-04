"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/firebase/useCollection";
import { createJournal, practicesQuery } from "@/lib/firebase/db";
import type { Practice } from "@/lib/types";
import { FullScreenLoader, PageHeader, Spinner } from "@/components/ui";

const CONDITIONS = [
  { v: 1, label: "絶不調" },
  { v: 2, label: "不調" },
  { v: 3, label: "普通" },
  { v: 4, label: "好調" },
  { v: 5, label: "絶好調" },
];

function NewJournalForm() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = profile?.teamId ?? null;

  const { data: practices } = useCollection<Practice>(
    () => (teamId ? practicesQuery(teamId) : null),
    [teamId],
  );

  const [practiceId, setPracticeId] = useState(searchParams.get("practiceId") ?? "");
  const [condition, setCondition] = useState(3);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.teamId) return;
    if (!content.trim()) {
      setError("振り返りを入力してください。");
      return;
    }
    setBusy(true);
    setError("");
    const practice = practices.find((p) => p.id === practiceId);
    try {
      await createJournal({
        teamId: profile.teamId,
        practiceId: practiceId || null,
        practiceTitle: practice ? `${practice.date} ${practice.title}` : "その他",
        authorId: profile.uid,
        authorName: profile.displayName,
        condition,
        content: content.trim(),
      });
      router.replace("/app/journal");
    } catch {
      setError("保存に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="振り返り日誌" subtitle="今日の反省・気づきを記録しよう" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <div>
            <label className="label">対象の練習（任意）</label>
            <select
              className="input"
              value={practiceId}
              onChange={(e) => setPracticeId(e.target.value)}
            >
              <option value="">指定なし</option>
              {practices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.date} {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">今日のコンディション</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCondition(c.v)}
                  className={`rounded-xl py-2 text-xs font-medium ring-1 transition ${
                    condition === c.v
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-500 ring-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">振り返り</label>
            <textarea
              className="input min-h-40"
              placeholder="できたこと・課題・次に意識することなど"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost flex-1">
            キャンセル
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? <Spinner /> : "投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewJournalPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <NewJournalForm />
    </Suspense>
  );
}
