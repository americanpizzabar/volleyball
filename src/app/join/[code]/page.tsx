"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getTeamNameByCode, joinTeamByCode } from "@/lib/db";
import { authErrorMessage } from "@/lib/auth-errors";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { Spinner } from "@/components/ui";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const router = useRouter();
  const { user, profile, signUp, loading, refreshProfile } = useAuth();

  const [teamName, setTeamName] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<Role, "coach">>("player");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 招待コードからチーム名を取得（未ログインでも可）
  useEffect(() => {
    let active = true;
    (async () => {
      const name = await getTeamNameByCode(code).catch(() => null);
      if (!active) return;
      setTeamName(name);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [code]);

  // すでにチーム所属済みならアプリへ
  useEffect(() => {
    if (!loading && profile?.teamId) router.replace("/app");
  }, [loading, profile?.teamId, router]);

  async function join(uid: string) {
    await joinTeamByCode(code, uid, role);
    await refreshProfile(); // pick up the joined team before navigating
    router.replace("/app");
  }

  // 新規登録して参加
  async function handleSignupJoin(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signUp(email, password, displayName.trim()); // establishes the session
      await join(""); // uid はサーバー側セッションから解決される
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  // ログイン済みユーザーがそのまま参加
  async function handleExistingJoin() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await join(user.id);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </div>

      {checking ? (
        <div className="flex justify-center py-10">
          <Spinner className="text-brand-600" />
        </div>
      ) : teamName === null ? (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm text-amber-800">
            この招待リンク（コード: {code}）のチームが見つかりませんでした。顧問に確認してください。
          </p>
          <Link href="/" className="btn-ghost mt-3 w-full">
            トップへ
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">チームに参加</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{teamName}</h1>

          {user ? (
            // すでにログイン済み（チーム未所属）
            <div className="mt-6 space-y-4">
              <div>
                <label className="label">あなたの役割</label>
                <RolePicker role={role} setRole={setRole} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={handleExistingJoin} disabled={busy} className="btn-primary w-full py-3">
                {busy ? <Spinner /> : `${teamName} に参加する`}
              </button>
            </div>
          ) : (
            // 新規登録して参加（名前・メール・パスワードだけ）
            <form onSubmit={handleSignupJoin} className="mt-6 space-y-4">
              <div>
                <label className="label">名前（部員名）</label>
                <input
                  required
                  className="input"
                  placeholder="山田 太郎"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">あなたの役割</label>
                <RolePicker role={role} setRole={setRole} />
              </div>
              <div>
                <label className="label">メールアドレス</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">パスワード（6文字以上）</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? <Spinner /> : "登録して参加"}
              </button>
              <p className="text-center text-sm text-slate-500">
                すでにアカウントがある？{" "}
                <Link href="/login" className="font-semibold text-brand-600">
                  ログイン
                </Link>
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function RolePicker({
  role,
  setRole,
}: {
  role: Exclude<Role, "coach">;
  setRole: (r: Exclude<Role, "coach">) => void;
}) {
  return (
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
  );
}
