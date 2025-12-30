# Stripe決済機能実装完了 - セットアップ手順

## ✅ 実装完了した機能

1. **Stripeクライアント** (`src/lib/stripe.ts`)
2. **Checkout Session作成API** (`src/app/api/subscription/create-checkout-session/route.ts`)
3. **Webhook処理** (`src/app/api/webhooks/stripe/route.ts`)
4. **決済完了ページ** (`src/app/subscription/success/page.tsx`)
5. **フロントエンドの更新** (`src/app/subscription/page.tsx`)

---

## 🔧 セットアップ手順

### Step 1: Stripeアカウントのセットアップ

1. [Stripe Dashboard](https://dashboard.stripe.com/)にアクセス
2. アカウントを作成（またはログイン）
3. **テストモード**で作業を開始

### Step 2: 商品と価格の作成

1. Stripe Dashboardで「商品」→「商品を追加」をクリック
2. 以下の商品を作成：

#### プレミアムプラン（月額）
- **名前**: プレミアムプラン（月額）
- **価格**: ¥980
- **請求頻度**: 毎月
- **価格ID**: `price_xxxxx`（後で使用）

#### プレミアムプラン（年額）
- **名前**: プレミアムプラン（年額）
- **価格**: ¥8,800
- **請求頻度**: 毎年
- **価格ID**: `price_xxxxx`（後で使用）

### Step 3: APIキーの取得

1. Stripe Dashboardで「開発者」→「APIキー」を開く
2. **公開可能キー**（`pk_test_...`）をコピー
3. **シークレットキー**（`sk_test_...`）をコピー

### Step 4: Webhookエンドポイントの設定

1. Stripe Dashboardで「開発者」→「Webhook」を開く
2. 「エンドポイントを追加」をクリック
3. **エンドポイントURL**: 
   - 開発環境: `http://localhost:3000/api/webhooks/stripe`（Stripe CLIを使用）
   - 本番環境: `https://your-domain.com/api/webhooks/stripe`
4. **イベントを選択**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **署名シークレット**（`whsec_...`）をコピー

### Step 5: 環境変数の設定

`.env`ファイルに以下を追加：

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs（Step 2で作成した価格ID）
STRIPE_PRICE_ID_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_YEARLY=price_xxxxx

# NextAuth（既存）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

### Step 6: 開発環境でのWebhookテスト（Stripe CLI）

ローカル開発環境でWebhookをテストする場合：

1. [Stripe CLI](https://stripe.com/docs/stripe-cli)をインストール
2. Stripe CLIでログイン：
   ```bash
   stripe login
   ```
3. Webhookを転送：
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. 表示された`whsec_...`を`.env`の`STRIPE_WEBHOOK_SECRET`に設定

---

## 🧪 テスト手順

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. テスト決済の実行

1. ブラウザで `http://localhost:3000/subscription` にアクセス
2. ログイン（または新規登録）
3. 「このプランを選択」ボタンをクリック
4. Stripe Checkoutページが表示される
5. テストカード情報を入力：
   - **カード番号**: `4242 4242 4242 4242`
   - **有効期限**: 任意の未来の日付（例: `12/34`）
   - **CVC**: 任意の3桁（例: `123`）
   - **郵便番号**: 任意（例: `12345`）
6. 「支払い」をクリック
7. 決済完了ページにリダイレクトされる

### 3. Webhookの確認

- Stripe Dashboardの「開発者」→「Webhook」でイベントを確認
- データベースでユーザーのプランが更新されているか確認

---

## 📝 注意事項

### 開発環境
- テストモードのAPIキーを使用
- Stripe CLIでWebhookを転送
- テストカードを使用して決済をテスト

### 本番環境
- 本番モードのAPIキーを使用
- Webhookエンドポイントを本番URLに設定
- HTTPSを使用（Stripeの要件）
- 実際のカード情報でテスト（少額のテスト決済）

---

## 🔍 トラブルシューティング

### Checkout Sessionが作成されない
- `STRIPE_SECRET_KEY`が正しく設定されているか確認
- Price IDが正しいか確認
- ブラウザのコンソールでエラーを確認

### Webhookが動作しない
- `STRIPE_WEBHOOK_SECRET`が正しく設定されているか確認
- WebhookエンドポイントのURLが正しいか確認
- Stripe DashboardでWebhookイベントが送信されているか確認

### プランが更新されない
- Webhookが正常に処理されているか確認
- データベースの接続を確認
- ログでエラーを確認

---

## 🚀 次のステップ

1. **Stripeアカウントのセットアップ**（約10分）
2. **商品と価格の作成**（約5分）
3. **環境変数の設定**（約2分）
4. **テスト決済の実行**（約5分）

**合計所要時間**: 約20-30分

実装は完了しています。上記のセットアップ手順に従って、Stripeアカウントを設定してください！
