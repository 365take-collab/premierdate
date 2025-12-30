# Stripe APIキー取得手順

## 📍 APIキーの場所

Stripe DashboardでAPIキーを取得する手順です。

---

## 🔑 Step 1: Stripe Dashboardにアクセス

1. [Stripe Dashboard](https://dashboard.stripe.com/)にログイン
2. 左上の「**開発者**」をクリック
3. 左サイドバーから「**APIキー**」をクリック

---

## 🔑 Step 2: 公開可能キー（Publishable Key）の取得

1. 「**公開可能キー**」セクションを確認
2. 「**公開可能キー**」の右側にある「**表示**」または「**コピー**」ボタンをクリック
3. `pk_test_...` で始まるキーをコピー
   - 例: `pk_test_REDACTED`

**このキーを `.env` ファイルの `STRIPE_PUBLISHABLE_KEY` に設定します**

---

## 🔐 Step 3: シークレットキー（Secret Key）の取得

1. 「**シークレットキー**」セクションを確認
2. 「**シークレットキー**」の右側にある「**表示**」または「**コピー**」ボタンをクリック
3. セキュリティのため、確認画面が表示される場合があります
4. `sk_test_...` で始まるキーをコピー
   - 例: `sk_test_REDACTED`

**⚠️ 重要**: シークレットキーは絶対に公開しないでください！

**このキーを `.env` ファイルの `STRIPE_SECRET_KEY` に設定します**

---

## 📋 Step 4: 価格ID（Price ID）の取得

商品と価格を作成したら、価格IDを取得します。

1. Stripe Dashboardで「**商品**」をクリック
2. 作成した商品をクリック（例: 「プレミアムプラン（月額）」）
3. 「**価格**」セクションで、作成した価格を確認
4. 価格IDをコピー（`price_...` で始まる）
   - 例: `price_1AbCdEfGhIjKlMnOpQrStUv`

**月額プランの価格IDを `.env` ファイルの `STRIPE_PRICE_ID_MONTHLY` に設定**
**年額プランの価格IDを `.env` ファイルの `STRIPE_PRICE_ID_YEARLY` に設定**

---

## 🔔 Step 5: Webhook署名シークレットの取得

Webhookを設定する場合（推奨）：

### 方法A: Stripe CLIを使用（開発環境推奨）

1. [Stripe CLI](https://stripe.com/docs/stripe-cli)をインストール
2. ターミナルで以下を実行：
   ```bash
   stripe login
   ```
3. Webhookを転送：
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. 表示された `whsec_...` をコピー

### 方法B: Stripe Dashboardで設定（本番環境）

1. Stripe Dashboardで「**開発者**」→「**Webhook**」をクリック
2. 「**エンドポイントを追加**」をクリック
3. **エンドポイントURL**を入力：
   - 開発環境: `http://localhost:3000/api/webhooks/stripe`（Stripe CLIを使用）
   - 本番環境: `https://your-domain.com/api/webhooks/stripe`
4. **イベントを選択**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 「**エンドポイントを追加**」をクリック
6. 作成されたエンドポイントをクリック
7. 「**署名シークレット**」セクションで「**表示**」をクリック
8. `whsec_...` で始まるシークレットをコピー

**このシークレットを `.env` ファイルの `STRIPE_WEBHOOK_SECRET` に設定します**

---

## 📝 Step 6: .envファイルの設定

`.env`ファイルに以下を追加：

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_ここにシークレットキーを貼り付け
STRIPE_PUBLISHABLE_KEY=pk_test_ここに公開可能キーを貼り付け
STRIPE_WEBHOOK_SECRET=whsec_ここにWebhook署名シークレットを貼り付け

# Stripe Price IDs
STRIPE_PRICE_ID_MONTHLY=price_ここに月額プランの価格IDを貼り付け
STRIPE_PRICE_ID_YEARLY=price_ここに年額プランの価格IDを貼り付け
```

**例**:
```env
STRIPE_SECRET_KEY=sk_test_REDACTED
STRIPE_PUBLISHABLE_KEY=pk_test_REDACTED
STRIPE_WEBHOOK_SECRET=whsec_REDACTED
STRIPE_PRICE_ID_MONTHLY=price_1AbCdEfGhIjKlMnOpQrStUv
STRIPE_PRICE_ID_YEARLY=price_1XyZaBcDeFgHiJkLmNoPqRsTu
```

---

## ✅ 確認方法

環境変数が正しく設定されているか確認：

```bash
# .envファイルの内容を確認（機密情報なので注意）
cat .env | grep STRIPE
```

---

## 🔍 よくある質問

### Q: テストモードと本番モードの違いは？
- **テストモード**: `sk_test_...` と `pk_test_...` で始まるキー
- **本番モード**: `sk_live_...` と `pk_live_...` で始まるキー
- 開発中はテストモードを使用してください

### Q: APIキーが見つからない
- 左上の「**開発者**」→「**APIキー**」を確認
- テストモードと本番モードを切り替えるトグルスイッチを確認

### Q: 価格IDが見つからない
- 「**商品**」→ 作成した商品をクリック → 「**価格**」セクションを確認
- 価格を作成していない場合は、先に価格を作成してください

---

## 🚀 次のステップ

環境変数を設定したら：

1. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```
2. ブラウザで `/subscription` にアクセス
3. テスト決済を実行

---

**APIキーの取得で不明な点があれば、お知らせください！**
