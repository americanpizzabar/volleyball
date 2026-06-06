"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";
import { Spinner } from "@/components/ui";

export default function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください。");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { needsConfirmation } = await signUp(email, password, displayName.trim());
      if (needsConfirmation) {
        // メール確認が必要な設定のとき：確認案内を表示（ログイン画面に戻さない）
        setConfirmEmail(true);
        setSubmitting(false);
      } else {
        router.replace("/onboarding");
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
            S
          </span>
          <span className="text-lg font-bold text-slate-900">サク戦</span>
        </Link>
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-sm font-semibold text-emerald-700">📧 確認メールを送信しました</p>
          <p className="mt-1 text-sm text-emerald-700">
            {email} に届いたメール内のリンクを開くと登録が完了します。
            その後ログインしてください。（迷惑メールフォルダもご確認ください）
          </p>
        </div>
        <Link href="/login" className="btn-ghost mt-4 w-full">
          ログインへ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">アカウント作成</h1>
      <p className="mt-1 text-sm text-slate-500">部活のメンバーと戦術を共有しよう。</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? <Spinner /> : "登録する"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        すでにアカウントがある？{" "}
        <Link href="/login" className="font-semibold text-brand-600">
          ログイン
        </Link>
      </p>
    </div>
  );
}
