"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createMatch } from "@/lib/db";
import { PageHeader, Spinner } from "@/components/ui";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMatchPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(today());
  const [tournament, setTournament] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isStaff = profile?.role === "coach" || profile?.role === "manager";
  if (profile && !isStaff) {
    return (
      <p className="card text-sm text-slate-500">
        試合の作成は顧問・マネージャーのみ可能です。
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.teamId) return;
    if (!opponent.trim()) {
      setError("対戦相手を入力してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await createMatch({
        teamId: profile.teamId,
        opponent: opponent.trim(),
        date,
        tournament: tournament.trim(),
        status: "live",
        currentSet: 1,
        sets: [{ us: 0, them: 0 }],
        createdBy: profile.uid,
      });
      router.replace(`/app/stats/${id}`);
    } catch {
      setError("作成に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="試合を作成" subtitle="スタッツの記録を開始" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <div>
            <label className="label">対戦相手</label>
            <input
              className="input"
              placeholder="例: 〇〇高校"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="w-44">
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
            <label className="label">大会名（任意）</label>
            <input
              className="input"
              placeholder="例: 春季リーグ / 県大会"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost flex-1">
            キャンセル
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? <Spinner /> : "記録を開始"}
          </button>
        </div>
      </form>
    </div>
  );
}
