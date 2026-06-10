"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useStackApp } from "@stackframe/stack";
import { authErrorMessage } from "@/lib/auth-errors";
import { Spinner } from "@/components/ui";

function ResetPasswordInner() {
  const app = useStackApp();
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください。");
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await app.resetPassword({ code, password });
      if (res.status === "error") throw new Error("リンクが無効か期限切れの可能性があります。");
      setDone(true);
      setTimeout(() => router.replace("/login"), 1400);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">新しいパスワード</h1>

      {!code ? (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm text-amber-800">
            リンクが無効か期限切れの可能性があります。もう一度お試しください。
          </p>
          <Link href="/forgot-password" className="btn-ghost mt-3 w-full">
            再設定リンクを送り直す
          </Link>
        </div>
      ) : done ? (
        <p className="mt-6 text-sm font-semibold text-emerald-700">
          ✓ パスワードを変更しました。ログインします…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">新しいパスワード（6文字以上）</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">確認用（もう一度）</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? <Spinner /> : "パスワードを変更"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
