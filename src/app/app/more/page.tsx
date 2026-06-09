"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/ui";

const LINKS = [
  { href: "/app/clubhouse", emoji: "🏠", label: "デジタル部室", desc: "活動量で部室がプロ仕様に進化" },
  { href: "/app/gacha", emoji: "🎴", label: "ミラクル・ガチャ", desc: "コインでプロのコツをコレクション" },
  { href: "/app/shadow", emoji: "🐉", label: "シャドウ・バトル", desc: "プロ統計をスタッツで疑似対戦" },
  { href: "/app/roster", emoji: "✨", label: "チーム・ステータス", desc: "好調オーラ・総合パワーで見える化" },
  { href: "/app/cards", emoji: "🃏", label: "プレーカード", desc: "ナイスプレーがレア度付きカードに" },
  { href: "/app/nutrition", emoji: "🍖", label: "栄養クエスト", desc: "食事でボスを討伐（チーム協力）" },
  { href: "/app/live", emoji: "📣", label: "応援ライブ", desc: "リアクションが全員の画面に弾幕で流れる" },
  { href: "/app/portfolio", emoji: "📈", label: "ポートフォリオ", desc: "スキルチェック・動画・目標(PDCA)" },
  { href: "/app/journal", emoji: "✍️", label: "振り返り日誌", desc: "練習の反省・コンディション記録" },
  { href: "/app/requests", emoji: "💡", label: "要望・情報共有", desc: "欲しい機能をリクエスト＆投票" },
  { href: "/app/stats/totals", emoji: "🏆", label: "通算成績", desc: "個人・チームの累計スタッツ" },
  { href: "/app/profile", emoji: "⚙️", label: "設定・メンバー", desc: "プロフィール・招待コード" },
  { href: "/app/help", emoji: "📕", label: "使い方ガイド", desc: "全機能のマニュアル" },
];

export default function MorePage() {
  const { profile, team } = useAuth();

  return (
    <div>
      <PageHeader title="もっと" subtitle={team?.name} />

      <div className="space-y-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card flex items-center gap-4 transition hover:ring-brand-300"
          >
            <span className="text-2xl">{l.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{l.label}</p>
              <p className="text-xs text-slate-500">{l.desc}</p>
            </div>
            <span className="text-2xl text-slate-300">›</span>
          </Link>
        ))}
      </div>

      {profile && (
        <p className="mt-6 text-center text-xs text-slate-400">
          {profile.displayName}（{ROLE_LABELS[profile.role]}）
        </p>
      )}
    </div>
  );
}
