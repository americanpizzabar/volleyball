# サク戦 (Saku-Sen) — バレー部アプリ

バレーボールの部活動のためのWEBアプリです。Next.js 16 (App Router) + Firebase で構築し、Vercel へデプロイします。

## 実装済み機能

### 土台
- メール＋パスワード認証（Firebase Auth）
- ロール管理：**顧問・コーチ / 部員 / マネージャー**
- チーム作成（顧問）＋ 招待コードによる参加（部員・マネージャー）
- モバイルファーストのUI（ボトムナビ）

### 機能① サク戦（デジタル戦術ノート）
- **今日のメニューと意図の共有**：顧問がテーマ・ねらい・メニューを投稿、部員が閲覧
- **アニメーション付きローテ確認**：コート上に選手を配置し「コマ（キーフレーム）」を複数作成。
  再生すると配置間を補間アニメーションし、「サーブが打たれたら前衛セッターはここへ走る」を視覚的に予習できる
- **振り返りコメント（日誌）**：部員がコンディションと反省を記録。顧問は全員の日誌を一覧・メンバー別に確認

### 機能② 部活スタッツ・クイック
- **超シンプル入力**：選手 ＞ スキル ＞ 結果 の **3タップ** で記録完了
- **スコアボード**：セットごとの得点を±ボタンで管理、セット移行・試合終了
- **リアルタイム集計**：第〇セット／試合全体を切り替えて、決定率・効果率・サーブレシーブ返球率・エースなどを即時表示（セット間ミーティング用）
- **通算成績ランキング**：エース王・スパイク決定数・決定率・レセプション返球率などを全試合横断で集計
- 記録は顧問・マネージャー、閲覧は部員全員

### 機能③ バレー・ポートフォリオ
- **ポジション別スキルチェック**：共通＋ポジション別スキルを5段階で**自己評価＆指導者評価**（並べて比較）
- **動画付き成長記録**：フォーム動画をアップロード（Firebase Storage）、過去と並べて比較。顧問の**ワンポイントアドバイス**コメント
- **目標設定（PDCA）**：目標(Plan)・達成基準・期限を設定し、**関連する練習メニューを紐付け(Do)**、振り返り(Check)・ステータス(Act)を管理
- 顧問はメンバーを選んで評価・閲覧できる

### 機能④ 要望・情報共有ボード
- 部員が「欲しい機能」「情報共有」「その他」を投稿し、**投票（▲）** できる
- 投票数の多い順に並び替え、カテゴリでフィルタ
- 顧問はステータス（受付中／対応予定／対応済み）を変更可能

🎉 仕様の4機能すべてを実装しました。

## セットアップ

### 1. Firebase プロジェクトを作る
1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** → ログイン方法 → **メール/パスワード** を有効化
3. **Firestore Database** を作成（本番モードで開始）
4. **Storage** を有効化（機能③の動画アップロードに使用）
5. プロジェクト設定 → マイアプリ → **ウェブアプリ** を追加し、表示される config の値を控える

### 2. 環境変数
`.env.local.example` を `.env.local` にコピーして、Firebase の値を入力します。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

これらは公開値（ブラウザに配信）です。データ保護は `firestore.rules` のセキュリティルールで担保します。

### 3. Firestore のルールとインデックスを反映
[Firebase CLI](https://firebase.google.com/docs/cli) を使います。

```bash
npm install -g firebase-tools
firebase login
firebase use your-project        # または firebase init で紐付け
firebase deploy --only firestore:rules,firestore:indexes,storage
```

> インデックスはコンソールに表示されるエラーリンクからも作成できます。
> 動画アップロードには Storage のルール（`storage.rules`）の反映が必要です。

### 4. ローカル起動

```bash
npm install
npm run dev
# http://localhost:3000
```

## Vercel へのデプロイ
1. このリポジトリを Vercel にインポート
2. **Environment Variables** に上記 `NEXT_PUBLIC_FIREBASE_*` をすべて設定
3. Firebase コンソール → Authentication → Settings → 承認済みドメインに Vercel のドメインを追加
4. デプロイ

## 使い方
1. 顧問が新規登録 → 「チームを作る」でチーム作成。設定画面で**招待コード**を確認
2. 部員・マネージャーが新規登録 → 「チームに参加」で招待コードを入力
3. 顧問が「メニュー作成」「ローテ図作成」、部員はホーム/ローテ/日誌で予習・記録

## ディレクトリ構成

```
src/
  app/                     ルーティング（App Router）
    page.tsx /login /signup /onboarding   公開ページ
    app/                   認証必須エリア（AppShell でガード）
      page.tsx             ホーム
      practices/           練習メニュー（今日のテーマと意図）
      tactics/             ローテ図・アニメーション
      stats/               スタッツ（試合・3タップ記録・集計・通算）
      portfolio/           ポートフォリオ（スキル・動画・目標PDCA）
      journal/             振り返り日誌
      requests/            要望・情報共有ボード（投票）
      more/                その他機能のハブ
      profile/             設定・招待コード・メンバー
  components/
    AppShell.tsx           ヘッダー＋ボトムナビ＋認証ガード
    tactics/               CourtCanvas / TacticViewer / TacticEditor
    ui.tsx                 共有UI
  context/AuthContext.tsx  認証・プロフィール・チームの購読
  lib/
    firebase/              初期化・データアクセス・購読フック
    court.ts               コート座標・ローテ補間
    types.ts               ドメイン型
firestore.rules            Firestore セキュリティルール
firestore.indexes.json     複合インデックス
storage.rules              Storage セキュリティルール（動画）
```

## 技術スタック
- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- Firebase (Auth, Firestore, Storage) — クライアントSDK
