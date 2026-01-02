# プレミアデート (Premier Date)

デートで失敗しない名店が見つかる、デート特化のグルメ検索サービス。

## 概要

プレミアデートは、デートに特化した情報を提供するグルメ検索サービスです。横並び席の有無、客層、ホテルまでの距離など、デートに必要な情報を1つの画面で確認できます。

## 技術スタック

- **フロントエンド**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js
- **決済**: Stripe（サブスクリプション）
- **ホスティング**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースのセットアップ

**推奨**: Supabase（無料プランで開発開始可能）

1. [Supabase](https://supabase.com/) でアカウント作成
2. 新しいプロジェクトを作成
3. データベース接続URLを取得
4. `.env`ファイルに設定

詳細な手順は `新サービス_デートガイド_データベースセットアップガイド.md` を参照してください。

### 3. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

**開発環境用（.env.local）**:
```env
# Database（Supabaseの場合の例）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# NextAuth.js
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# メール送信設定（SMTP）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@premierdate.jp"
```

**本番環境用（Vercel環境変数）**:
```env
NEXTAUTH_URL="https://premierdate.jp"
NEXT_PUBLIC_BASE_URL="https://premierdate.jp"
SMTP_FROM="noreply@premierdate.jp"
```

詳細は `.env.example` を参照してください。

# Stripe（オプション - Utageを使用する場合は不要）
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Utage決済連携（推奨）
UTAGE_CHECKOUT_URL_MONTHLY="https://utage.jp/checkout/monthly"
UTAGE_CHECKOUT_URL_YEARLY="https://utage.jp/checkout/yearly"
UTAGE_MEMBER_URL="https://utage-system.com/member"
UTAGE_WEBHOOK_SECRET="your-webhook-secret-key"
UTAGE_TOKEN_SECRET="your-token-secret-key"

# ⚠️ 開発環境用（本番環境では絶対に設定しないこと）
# UTAGE_ALLOW_DEV_LOGIN="true"
# UTAGE_ALLOW_SIMPLE_LOGIN="true"
# UTAGE_AUTO_CREATE_USER="true"
```

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run db:generate

# データベースマイグレーション
npm run db:migrate

# 初期データの投入（オプション）
npm run db:seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## 開発コマンド

- `npm run dev`: 開発サーバーを起動
- `npm run build`: プロダクション用にビルド
- `npm run start`: プロダクションサーバーを起動
- `npm run lint`: ESLintでコードをチェック
- `npm run db:generate`: Prismaクライアントを生成
- `npm run db:migrate`: データベースマイグレーションを実行
- `npm run db:seed`: 初期データを投入
- `npm run db:studio`: Prisma Studioを起動（データベースの視覚的な管理ツール）

## プロジェクト構造

```
premier-date/
├── prisma/
│   └── schema.prisma          # Prismaスキーマ定義
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   └── (routes)/          # ページルート
│   ├── lib/                   # ユーティリティ関数
│   │   ├── prisma.ts          # Prismaクライアント
│   │   └── seed.ts            # シードデータ
│   └── components/            # Reactコンポーネント
├── public/                    # 静的ファイル
└── package.json
```

## データモデル

### 主要なモデル

- **User**: ユーザー情報（無料/プレミアムプラン）
- **Restaurant**: 店舗情報（デート特化情報を含む）
- **Review**: レビュー情報（デート適性評価）
- **Favorite**: お気に入り情報
- **DateCourse**: デートコース提案
- **PurposeCategory**: 用途カテゴリ（初デート、誕生日など）

詳細は `prisma/schema.prisma` を参照してください。

## 機能

### 無料プラン

- デート特化情報の閲覧（横並び席、客層、ホテルまでの距離）
- 基本的な検索機能
- 用途別ランキング
- デート特化レビューの閲覧（基本情報のみ）

### プレミアムプラン（月額980円）

- すべての基本機能
- 詳細な検索条件（雰囲気、客層など）
- お気に入り機能
- デートコース提案
- 優先サポート
- 新着店舗情報の通知
- すべてのデート特化レビューを閲覧

## 開発ロードマップ

### Phase 1: MVP開発（1-2ヶ月）

- [x] プロジェクトセットアップ
- [x] データベーススキーマ設計
- [ ] 認証機能
- [ ] 店舗一覧・詳細表示
- [ ] 基本検索機能
- [ ] ランキング機能
- [ ] 基本レビュー表示

### Phase 2: プレミアム機能実装（1ヶ月）

- [ ] Stripe連携
- [ ] お気に入り機能
- [ ] 詳細検索機能
- [ ] プレミアム限定レビュー
- [ ] 通知機能
- [ ] デートコース提案

### Phase 3: 改善・最適化（継続的）

- [ ] A/Bテスト
- [ ] パフォーマンス最適化
- [ ] UI/UX改善
- [ ] データ拡充
- [ ] AI機能（パーソナライズされた推薦）

## ライセンス

このプロジェクトはプライベートプロジェクトです。
