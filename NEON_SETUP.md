# Neon + Vercel セットアップ手順

このアプリのデータベースは **Supabase から Neon (Vercel連携) へ移行**しました。
構成は次のとおりです。

| 役割            | 使用サービス                          |
| --------------- | ------------------------------------- |
| データベース    | **Neon** (Postgres / Vercel連携)      |
| 認証（ログイン）| **Neon Auth**（Stack Auth）           |
| 動画ストレージ  | **Vercel Blob**                       |
| リアルタイム    | （廃止：画面表示時・再読込時に取得）  |

ブラウザは DB に直接アクセスせず、すべての読み書きは Next.js の Server Functions
(`src/lib/server/actions.ts`) を経由します。認可（チーム単位のアクセス制御）は
ここで行われ、これが旧 Supabase の RLS の役割を担います。

---

## 1. Neon データベースを Vercel に接続

1. Vercel のプロジェクト → **Storage** → **Create Database** → **Neon** を選択
   （または [Neon](https://neon.tech) で作成し Vercel Integration で接続）。
2. 接続すると Vercel に `DATABASE_URL` が自動で追加されます（**Pooled** 接続文字列）。
3. Neon の **SQL Editor** を開き、`neon/schema.sql` の中身を貼り付けて実行し、
   テーブルを作成します。

## 2. Neon Auth（ログイン）を有効化

1. Neon プロジェクトの **Auth** タブで **Neon Auth** を有効化します。
2. 生成された次のキーを Vercel の環境変数に設定します。
   - `NEXT_PUBLIC_STACK_PROJECT_ID`（公開）
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`（公開）
   - `STACK_SECRET_SERVER_KEY`（秘密）
3. Stack のダッシュボードで **Email/Password** サインインを有効化します。
   - メール確認を不要にしたい場合は「Require email verification」をオフに。
   - パスワード再設定メールのリンク先は既定で `/handler/reset-password` です。

## 3. Vercel Blob（動画）を有効化

1. Vercel → **Storage** → **Create** → **Blob**。
2. `BLOB_READ_WRITE_TOKEN` が環境変数に自動追加されます。

## 4. ローカル開発

`.env.local.example` を `.env.local` にコピーし、上記の値を入力してください。

```bash
cp .env.local.example .env.local
# 値を貼り付けてから
npm run dev
```

---

## 移行に伴う変更点

- **リアルタイム購読は廃止**。一覧・詳細はページ表示時／再読込時に取得します。
  応援ライブ（`/app/live`）のエフェクトは端末内ローカル表示になりました。
- ユーザーIDは Neon Auth (Stack) のID（text）。`profiles.id` がこれに対応します。
- 配列カラム（`voters` / `tactic_ids` / `practice_ids` / `tags`）は jsonb 配列で保持。
- 旧 Supabase 用の `supabase/migrations/` は参照用に残してありますが、
  新環境では `neon/schema.sql` を使用してください。
