"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { createPractice, tacticsQuery } from "@/lib/db";
import type { Tactic } from "@/lib/types";
import { PageHeader, Spinner } from "@/components/ui";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewPracticePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const teamId = profile?.teamId ?? null;

  const { data: tactics } = useCollection<Tactic>(
    () => (teamId ? tacticsQuery(teamId) : null),
    [teamId],
  );

  const [date, setDate] = useState(today());
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [intent, setIntent] = useState("");
  const [menu, setMenu] = useState("");
  const [tacticIds, setTacticIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (profile && profile.role !== "coach") {
    return (
      <p className="card text-sm text-slate-500">
        メニューの作成は顧問・コーチのみ可能です。
      </p>
    );
  }

  function toggleTactic(id: string) {
    setTacticIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

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
      const id = await createPractice({
        teamId: profile.teamId,
        date,
        title: title.trim(),
        theme: theme.trim(),
        intent: intent.trim(),
        menu: menu.trim(),
        tacticIds,
        createdBy: profile.uid,
      });
      router.replace(`/app/practices/${id}`);
    } catch {
      setError("保存に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="練習メニューを作成" subtitle="今日のテーマと意図を共有" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <div className="flex gap-3">
            <div className="w-40">
              <label className="label">日付</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">タイトル</label>
            <input
              className="input"
              placeholder="例: 平日練習 / 県大会前最終調整"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">今日のテーマ</label>
            <input
              className="input"
              placeholder="例: ブロックとレシーブの連動"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>
          <div>
            <label className="label">意図・ねらい</label>
            <textarea
              className="input min-h-20"
              placeholder="なぜこの練習をするのか、何を意識してほしいか"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
          </div>
          <div>
            <label className="label">メニュー（任意）</label>
            <textarea
              className="input min-h-24"
              placeholder={"・アップ\n・対人レシーブ\n・3対3ブロックフォロー\n・ゲーム形式"}
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <p className="label">ローテ・配置図をリンク（任意）</p>
          {tactics.length === 0 ? (
            <p className="text-sm text-slate-500">
              ローテ図がまだありません。先に作成すると、ここでリンクできます。
            </p>
          ) : (
            <div className="space-y-2">
              {tactics.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition ${
                    tacticIds.includes(t.id)
                      ? "bg-brand-50 ring-brand-300"
                      : "bg-white ring-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={tacticIds.includes(t.id)}
                    onChange={() => toggleTactic(t.id)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t.title}{" "}
                    <span className="text-xs text-slate-400">ローテ{t.rotation}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost flex-1">
            キャンセル
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? <Spinner /> : "共有する"}
          </button>
        </div>
      </form>
    </div>
  );
}
