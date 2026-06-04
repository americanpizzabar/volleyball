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

> 機能②スタッツ・クイック、③ポートフォリオ、④機能リクエスト投票は今後の実装予定です。

## セットアップ

### 1. Firebase プロジェクトを作る
1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** → ログイン方法 → **メール/パスワード** を有効化
3. **Firestore Database** を作成（本番モードで開始）
4. プロジェクト設定 → マイアプリ → **ウェブアプリ** を追加し、表示される config の値を控える

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
firebase deploy --only firestore:rules,firestore:indexes
```

> インデックスはコンソールに表示されるエラーリンクからも作成できます。

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
      journal/             振り返り日誌
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
firestore.rules            セキュリティルール
firestore.indexes.json     複合インデックス
```

## 技術スタック
- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- Firebase (Auth, Firestore) — クライアントSDK
