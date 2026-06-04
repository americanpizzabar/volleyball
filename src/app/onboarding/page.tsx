"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createTeam, joinTeamByCode } from "@/lib/firebase/db";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { FullScreenLoader, Spinner } from "@/components/ui";

type Mode = "choose" | "create" | "join";

export default function OnboardingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [teamName, setTeamName] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<Exclude<Role, "coach">>("player");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile?.teamId) router.replace("/app");
  }, [loading, user, profile, router]);

  if (loading || !user) return <FullScreenLoader />;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !user) return;
    setBusy(true);
    setError("");
    try {
      await createTeam(teamName.trim(), user.uid);
      router.replace("/app");
    } catch {
      setError("チームの作成に失敗しました。");
      setBusy(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !user) return;
    setBusy(true);
    setError("");
    try {
      await joinTeamByCode(code.trim(), user.uid, role);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">チームの設定</h1>
      <p className="mt-1 text-sm text-slate-500">
        ようこそ、{profile?.displayName ?? "部員"}さん。チームを作るか、参加しよう。
      </p>

      {mode === "choose" && (
        <div className="mt-8 space-y-3">
          <button
            onClick={() => setMode("create")}
            className="card flex w-full items-center gap-4 text-left transition hover:ring-brand-300"
          >
            <span className="text-3xl">🏐</span>
            <span>
              <span className="block font-bold text-slate-900">チームを作る</span>
              <span className="block text-sm text-slate-500">
                顧問・コーチとして新しい部活を作成
              </span>
            </span>
          </button>
          <button
            onClick={() => setMode("join")}
            className="card flex w-full items-center gap-4 text-left transition hover:ring-brand-300"
          >
            <span className="text-3xl">🔑</span>
            <span>
              <span className="block font-bold text-slate-900">チームに参加</span>
              <span className="block text-sm text-slate-500">
                招待コードで部員・マネージャーとして参加
              </span>
            </span>
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="mt-8 space-y-4">
          <div>
            <label className="label">チーム名</label>
            <input
              required
              autoFocus
              className="input"
              placeholder="〇〇高校 男子バレー部"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            作成するとあなたは「顧問・コーチ」になります。招待コードは作成後に確認できます。
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy ? <Spinner /> : "チームを作成"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="btn-ghost w-full">
            戻る
          </button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoin} className="mt-8 space-y-4">
          <div>
            <label className="label">招待コード</label>
            <input
              required
              autoFocus
              className="input uppercase tracking-widest"
              placeholder="ABC123"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="label">あなたの役割</label>
            <div className="grid grid-cols-2 gap-2">
              {(["player", "manager"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition ${
                    role === r
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy ? <Spinner /> : "参加する"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="btn-ghost w-full">
            戻る
          </button>
        </form>
      )}
    </div>
  );
}
