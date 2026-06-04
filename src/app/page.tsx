"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    emoji: "📋",
    title: "サク戦：デジタル戦術ノート",
    desc: "今日のテーマと配置図を共有。アニメーション付きローテで、通学中でもスマホで予習できる。",
  },
  {
    emoji: "📊",
    title: "スタッツ・クイック",
    desc: "タップ3回でスパイク決定率やサーブレシーブ返球率を自動集計（今後実装）。",
  },
  {
    emoji: "📈",
    title: "バレー・ポートフォリオ",
    desc: "ポジション別スキルチェックと動画で、一人ひとりの成長を可視化（今後実装）。",
  },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [loading, user, router]);

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <header className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </header>

      <section className="mt-12 text-center">
        <span className="chip bg-brand-100 text-brand-700">部活専用バレーボールアプリ</span>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900">
          練習の質を、
          <br />
          <span className="text-brand-600">タップ</span>で最大化。
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          配置の説明に10分。その時間を、アプリでの予習に変える。
          顧問の戦術を、部員みんながスマホで先に理解できる
          「デジタル戦術ノート」。
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <Link href="/signup" className="btn-primary w-full py-3">
            はじめる（無料）
          </Link>
          <Link href="/login" className="btn-ghost w-full py-3">
            ログイン
          </Link>
        </div>
      </section>

      <section className="mt-14 space-y-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card flex gap-4">
            <div className="text-3xl">{f.emoji}</div>
            <div>
              <h3 className="font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-16 pb-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} サク戦 — バレー部のためのアプリ
      </footer>
    </div>
  );
}
