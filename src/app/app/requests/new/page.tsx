"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createRequest } from "@/lib/firebase/db";
import {
  REQUEST_CATEGORY_LABELS,
  type RequestCategory,
} from "@/lib/types";
import { PageHeader, Spinner } from "@/components/ui";

export default function NewRequestPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState<RequestCategory>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.teamId) return;
    if (!title.trim()) {
      setError("タイトルを入力してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createRequest({
        teamId: profile.teamId,
        title: title.trim(),
        description: description.trim(),
        category,
        status: "open",
        authorId: profile.uid,
        authorName: profile.displayName,
        voters: [profile.uid], // 投稿者は自動で1票
      });
      router.replace("/app/requests");
    } catch {
      setError("投稿に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="投稿する" subtitle="要望・アイデア・情報を共有" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <div>
            <label className="label">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(REQUEST_CATEGORY_LABELS) as RequestCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-xl px-2 py-2.5 text-xs font-medium ring-1 transition ${
                    category === c
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  {REQUEST_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">タイトル</label>
            <input
              className="input"
              placeholder="例: サーブ練習の時間を増やしたい"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">詳細（任意）</label>
            <textarea
              className="input min-h-28"
              placeholder="内容や理由を書きましょう"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
