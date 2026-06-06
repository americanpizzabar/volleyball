"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";
import { Spinner } from "@/components/ui";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">パスワード再設定</h1>
      <p className="mt-1 text-sm text-slate-500">
        登録したメールアドレスに再設定用のリンクを送ります。
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-sm font-semibold text-emerald-700">
            📧 メールを送信しました
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {email} 宛のメール内のリンクを開いて、新しいパスワードを設定してください。
            （迷惑メールフォルダもご確認ください）
          </p>
          <Link href="/login" className="btn-ghost mt-3 w-full">
            ログインに戻る
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? <Spinner /> : "再設定リンクを送る"}
          </button>
          <Link href="/login" className="block text-center text-sm text-slate-500">
            ← ログインに戻る
          </Link>
        </form>
      )}
    </div>
  );
}
