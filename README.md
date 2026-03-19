# Loto6 Check (Cloudflare Workers版)

ロト6の当選番号チェックアプリ。ユーザーが登録した番号と当選番号を照合し、当選結果を表示します。

## 技術スタック

- **フロントエンド**: Next.js 15 + React 19 + Tailwind CSS 4 + daisyUI 5
- **バックエンド**: Next.js API Routes (Cloudflare Workers上で動作)
- **デプロイ**: OpenNext + Cloudflare Workers
- **データベース**: Cloudflare D1（SQLite）
- **認証**: カスタムJWT（PBKDF2 + HMAC-SHA256, Web Crypto API）
- **当選番号取得**: loto6-auto-update（Cloud Run + Puppeteer）経由で取得
- **自動更新**: cron-job.org → loto6-auto-update → `/api/loto6/import` でD1に同期（月・木22:00 JST）

## 機能

- ユーザー登録・ログイン
- ロト6番号の登録・削除
- 当選番号との照合（1等〜5等）
- 期間指定での当選番号チェック
- 当選番号の自動取得（loto6-auto-updateからのデータ同期）

## 自動更新の仕組み

Cloudflare WorkersからはAkamai WAFにより、みずほ銀行への直接アクセスがブロックされるため、別サービス経由でデータを取得しています。

```
cron-job.org（月・木 22:00 JST）
  → loto6-auto-update（Cloud Run + Puppeteer）
    → みずほ銀行をスクレイピング → Neon保存
    → POST /api/loto6/import → Cloudflare D1保存
```

### 必要な環境変数（loto6-auto-update側）

| 変数名 | 説明 |
|--------|------|
| `CLOUDFLARE_APP_URL` | このアプリのURL（例: `https://loto6-check.xxx.workers.dev`） |
| `CLOUDFLARE_API_KEY` | このアプリの `AUTO_UPDATE_API_KEY` と同じ値 |

## セットアップ

```bash
npm install
```

### ローカル開発

```bash
# D1スキーマの適用（ローカル）
npx wrangler d1 execute loto6-check-db --file=db/schema.sql --local

# 開発サーバー起動
npm run preview
```

### デプロイ

```bash
# シークレットの設定
npx wrangler secret put JWT_SECRET
npx wrangler secret put AUTO_UPDATE_API_KEY

# D1スキーマの適用（リモート）
npx wrangler d1 execute loto6-check-db --file=db/schema.sql --remote

# デプロイ
npm run deploy
```

## プロジェクト構成

```
src/
  app/
    api/
      auth/       - 認証API (login, register, me, logout)
      loto6/      - ロト6API (register, list, delete, from-db, auto-update, import)
    login/        - ログインページ
    signup/       - 新規登録ページ
  components/     - UIコンポーネント
  context/        - AuthContext
  lib/
    auth.ts       - JWT認証
    password.ts   - パスワードハッシュ
    db.ts         - D1ヘルパー
    loto6/        - ロト6ロジック (check, scraper, types)
db/
  schema.sql      - D1スキーマ
scripts/
  export-from-neon.js  - Neonからのデータエクスポート
  import-to-d1.js      - D1へのデータインポート
```
