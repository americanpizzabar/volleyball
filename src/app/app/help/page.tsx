import Link from "next/link";
import { PageHeader } from "@/components/ui";

interface Section {
  icon: string;
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    icon: "🚀",
    title: "はじめに（3つの役割）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>顧問・コーチ</b>：チーム作成、メニュー・ローテ作成、スタッツ記録、メンバーのA/B編成・評価ができます。</li>
        <li><b>マネージャー</b>：試合の作成・スタッツ記録ができます。</li>
        <li><b>部員</b>：予習（ローテ/お手本）、日誌、目標、要望、自分のポートフォリオの記録ができます。</li>
      </ul>
    ),
  },
  {
    icon: "🔑",
    title: "最初の準備（チーム作成・参加）",
    body: (
      <ol className="list-decimal space-y-1 pl-5">
        <li>顧問が「新規登録」→「チームを作る」。</li>
        <li><b>設定（もっと→設定・メンバー）</b>に表示される<b>QRコード／招待リンク</b>を部員に共有。</li>
        <li>部員はQR/リンクを開き、名前・役割・メール・パスワードを入力するだけで参加完了（コード入力不要）。</li>
        <li>顧問は設定のメンバー一覧で、各部員の役割や<b>A/Bチーム</b>を割り当てられます。</li>
      </ol>
    ),
  },
  {
    icon: "📋",
    title: "メニュー（今日のテーマと意図）",
    body: (
      <p>顧問が「今日のテーマ・ねらい・練習メニュー」を投稿し、ローテ図を添付できます。部員はホームや「メニュー」タブで予習し、各メニューから振り返り日誌を書けます。</p>
    ),
  },
  {
    icon: "🏐",
    title: "ローテ（戦術ボード）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>ローテ図</b>：選手をドラッグ配置、コマ(キーフレーム)を複数作り「再生バー」をなぞるとボールが放物線で動き、助走ベクトル(矢印)も表示。<b>2D/3D切替</b>可。</li>
        <li><b>ローテシミュレーター</b>：選手を選ぶと反則にならない<b>青い安全ゾーン</b>を表示。かぶると赤く点滅＋振動。控えとの交代も可。</li>
        <li><b>プロ戦術ライブラリ</b>：シンクロ攻撃・時間差・ブロード等の<b>お手本</b>をアニメで予習。顧問はチームに保存可。</li>
        <li><b>ローテ・マスター・チャレンジ</b>：かぶりを直す1分パズル。PERFECTでタイム記録。</li>
      </ul>
    ),
  },
  {
    icon: "📊",
    title: "スタッツ（試合記録）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>顧問・マネージャーが試合を作成し記録。入力は3方式：<b>ボタン</b>（選手→スキル→結果の3タップ）／<b>コート</b>（選手→落下地点の2タッチ）／<b>なぞる</b>（一筆書きで一連を記録）。</li>
        <li>スコアボード、セット/試合全体の自動集計（決定率・効果率・返球率など）。</li>
        <li><b>ショットチャート</b>（点/ヒートマップ・選手別/結果別フィルタ）、<b>通算成績ランキング</b>。</li>
        <li>記録は内部で<b>DataVolley互換コード</b>を生成し、テキストでエクスポートできます。</li>
      </ul>
    ),
  },
  {
    icon: "📈",
    title: "ポートフォリオ（個人の成長）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>スキル</b>：ポジション別スキルを5段階で自己評価＆指導者評価。能力レーダー（本人 vs Aチーム平均）。評価UPでレベルアップ演出。</li>
        <li><b>プロ比較</b>：自分のスタッツをVリーグ平均・代表トップの参考値と比較。</li>
        <li><b>動画</b>：フォーム動画をアップロードし、顧問のワンポイントコメント。</li>
        <li><b>目標</b>：PDCAで目標→練習紐付け→振り返り→達成管理。</li>
      </ul>
    ),
  },
  {
    icon: "✨",
    title: "ゲーミフィケーション（楽しむ仕掛け）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>チーム・ステータス</b>：総合パワーのバー、好調な選手は青いオーラ＋🔥。</li>
        <li><b>プレーカード</b>：ナイスプレーが自動でレア度付きカードに。パック開封演出。</li>
        <li><b>栄養クエスト</b>：食事を記録して攻撃力に。チームで週替わりボスを討伐（コンボ倍率あり）。</li>
        <li><b>応援ライブ</b>：👏🔥❤️をタップすると全員の画面に弾幕。試合のナイスプレーも自動で流れます。</li>
        <li><b>要望・投票</b>：欲しい機能や情報共有を投稿し、▲で投票。</li>
      </ul>
    ),
  },
  {
    icon: "🔧",
    title: "困ったとき",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>パスワードを変えたい</b>：設定→「パスワード変更」（メール不要）。</li>
        <li><b>ログインできない</b>：新規登録ではなく「ログイン」を選び、メールとパスワードを確認。自動入力の古いPWに注意。</li>
        <li><b>役割・ポジションを変えたい</b>：自分のポジション/背番号は設定で、役割やA/Bは顧問が設定で変更します。</li>
      </ul>
    ),
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="使い方ガイド" subtitle="サク戦のすべての機能をかんたん解説" />

      <div className="space-y-2">
        {SECTIONS.map((s, i) => (
          <details key={s.title} className="card" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-800">
              <span className="text-xl">{s.icon}</span>
              {s.title}
              <span className="ml-auto text-slate-300">▾</span>
            </summary>
            <div className="mt-3 text-sm leading-relaxed text-slate-600">{s.body}</div>
          </details>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        分からないことは「要望・情報共有」から質問・リクエストできます。
      </p>

      <Link href="/app" className="mt-4 block text-center text-sm text-slate-400">
        ← ホームに戻る
      </Link>
    </div>
  );
}
