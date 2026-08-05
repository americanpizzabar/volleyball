"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    emoji: "📋",
    title: "デジタル戦術ノート",
    desc: "今日のテーマと配置図を共有。助走ベクトル付きのローテ図を2D/3Dで再生でき、通学中でもスマホで予習できる。",
  },
  {
    emoji: "📊",
    title: "スタッツ・クイック",
    desc: "タップ3回でスパイク決定率やサーブレシーブ返球率を自動集計。ショットチャートやプロ基準との比較まで。",
  },
  {
    emoji: "📈",
    title: "バレー・ポートフォリオ",
    desc: "ポジション別スキルのレーダー、目標のPDCA、フォーム動画で、一人ひとりの成長を可視化。",
  },
  {
    emoji: "🎮",
    title: "続けたくなる仕掛け",
    desc: "食事バトル・プレイガチャ・応援ライブなど、日々の活動が楽しくなるゲーミフィケーション。",
  },
];

const STEPS = [
  { n: "1", t: "無料で登録", d: "顧問はチームを作成、部員は招待コードで参加。" },
  { n: "2", t: "戦術・記録を共有", d: "ローテ図や試合スタッツをチームでリアルタイムに。" },
  { n: "3", t: "振り返って強くなる", d: "スタッツとポートフォリオで次の一手が見える。" },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [loading, user, router]);

  return (
    <div className="mx-auto max-w-lg px-5 pb-28 pt-10">
      <header className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-black text-white">
          S
        </span>
        <span className="text-lg font-bold text-slate-900">サク戦</span>
      </header>

      <section className="mt-12 text-center">
        <span className="chip bg-brand-100 text-brand-700">部活専用バレーボールアプリ</span>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900">
          練習の質を、
          <br />
          <span className="text-brand-600">タップ</span>で最大化。
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          配置の説明に10分。その時間を予習に変える。顧問の戦術を部員みんなが
          スマホで先に理解し、試合はタップで記録・集計。強くなるサイクルを、
          このアプリひとつで。
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <Link href="/signup" className="btn-primary w-full py-3 text-base">
            はじめる（無料）
          </Link>
          <Link href="/login" className="btn-ghost w-full py-3">
            ログイン
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          招待コードをお持ちの方も、まず登録してから参加できます。
        </p>
      </section>

      {/* Feature mock: a tiny rotation-board glance instead of a bare emoji */}
      <section className="mt-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-slate-900 p-5 text-white shadow-lg">
          <p className="text-xs font-semibold text-white/70">ローテ図プレビュー</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["S", "OP", "MB", "OH", "MB", "OH"].map((pos, i) => (
              <div
                key={i}
                className="grid aspect-square place-items-center rounded-xl bg-white/10 text-sm font-bold ring-1 ring-white/15"
              >
                {pos}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/70">
            指でなぞると助走と軌道がアニメで動く。2D / 3D 切替対応。
          </p>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-bold text-slate-700">できること</h2>
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

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold text-slate-700">はじめかたは3ステップ</h2>
        <ol className="space-y-2">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                {s.n}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{s.t}</p>
                <p className="text-sm text-slate-500">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10">
        <Link href="/signup" className="btn-primary w-full py-3 text-base">
          無料でチームを始める
        </Link>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} サク戦 — バレー部のためのアプリ
      </footer>
    </div>
  );
}
