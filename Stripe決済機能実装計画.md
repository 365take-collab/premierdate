# Stripe決済機能実装計画

## 📊 現在の状況

### ✅ 実装済み
- プラン選択ページ（`/subscription`）
- プランアップグレードAPI（`/api/subscription/upgrade`）- プレースホルダー
- 制限機能の実装（お気に入り、レビュー、デートコース）
- データベーススキーマ（Stripe関連フィールドあり）
  - `stripe_customer_id`
  - `stripe_subscription_id`

### ⏳ 未実装
- **Stripe決済の実装**（現在はUtage決済のプレースホルダー）
- Stripe Checkout Sessionの作成
- Webhook処理（サブスクリプション更新・キャンセル）
- 決済完了後の処理

---

## 🎯 実装する機能

### 1. Stripe Checkout Sessionの作成

**エンドポイント**: `POST /api/subscription/create-checkout-session`

**機能**:
- ユーザーが選択したプラン（月額/年額）に基づいてStripe Checkout Sessionを作成
- サブスクリプション商品と価格を設定
- 成功・キャンセル時のリダイレクトURLを設定

**実装内容**:
```typescript
// Stripe Checkout Sessionを作成
const session = await stripe.checkout.sessions.create({
  customer: customerId, // 既存の顧客IDまたは新規作成
  payment_method_types: ['card'],
  line_items: [{
    price: priceId, // 月額または年額の価格ID
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/subscription?canceled=true`,
})
```

### 2. Webhook処理

**エンドポイント**: `POST /api/webhooks/stripe`

**処理するイベント**:
- `checkout.session.completed` - 決済完了時
- `customer.subscription.created` - サブスクリプション作成時
- `customer.subscription.updated` - サブスクリプション更新時
- `customer.subscription.deleted` - サブスクリプションキャンセル時
- `invoice.payment_succeeded` - 請求書の支払い成功時
- `invoice.payment_failed` - 請求書の支払い失敗時

**実装内容**:
- イベントタイプに応じてデータベースを更新
- ユーザーのプランタイプを更新
- サブスクリプションの開始日・終了日を更新

### 3. 決済完了ページ

**ページ**: `/subscription/success`

**機能**:
- 決済完了の確認
- プラン情報の表示
- ダッシュボードへのリンク

### 4. サブスクリプション管理

**エンドポイント**: 
- `POST /api/subscription/cancel` - サブスクリプションのキャンセル
- `GET /api/subscription/status` - サブスクリプションの状態確認

---

## 📦 必要なパッケージ

```bash
npm install stripe
npm install -D @types/stripe
```

---

## 🔧 実装手順

### Step 1: Stripeアカウントのセットアップ

1. [Stripe Dashboard](https://dashboard.stripe.com/)でアカウント作成
2. テストモードでAPIキーを取得
3. 商品と価格を作成
   - プレミアムプラン（月額）: ¥980
   - プレミアムプラン（年額）: ¥8,800
4. Webhookエンドポイントを設定
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - イベント: 上記のイベントを選択

### Step 2: 環境変数の設定

`.env`ファイルに追加：
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 3: Stripeクライアントの作成

`src/lib/stripe.ts`を作成：
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})
```

### Step 4: Checkout Session作成APIの実装

`src/app/api/subscription/create-checkout-session/route.ts`を作成

### Step 5: Webhook処理の実装

`src/app/api/webhooks/stripe/route.ts`を作成

### Step 6: フロントエンドの更新

`src/app/subscription/page.tsx`を更新して、Stripe Checkoutにリダイレクト

---

## 💰 価格設定

### 月額プラン
- **価格**: ¥980/月
- **Stripe Price ID**: `price_xxxxx`（Stripe Dashboardで作成）

### 年額プラン
- **価格**: ¥8,800/年（月額換算: ¥733）
- **割引率**: 約25%OFF
- **Stripe Price ID**: `price_xxxxx`（Stripe Dashboardで作成）

---

## 🔐 セキュリティ

1. **Webhook署名の検証**: StripeからのWebhookリクエストの署名を検証
2. **サーバーサイドでの処理**: 決済処理はすべてサーバーサイドで実行
3. **環境変数の保護**: APIキーは環境変数で管理

---

## 📝 実装ファイル一覧

1. `src/lib/stripe.ts` - Stripeクライアント
2. `src/app/api/subscription/create-checkout-session/route.ts` - Checkout Session作成
3. `src/app/api/webhooks/stripe/route.ts` - Webhook処理
4. `src/app/subscription/success/page.tsx` - 決済完了ページ
5. `src/app/api/subscription/cancel/route.ts` - キャンセル処理
6. `src/app/api/subscription/status/route.ts` - 状態確認

---

## 🚀 次のステップ

1. **Stripeアカウントのセットアップ**（約10分）
2. **必要なパッケージのインストール**（約1分）
3. **環境変数の設定**（約2分）
4. **Stripeクライアントの作成**（約5分）
5. **Checkout Session作成APIの実装**（約30分）
6. **Webhook処理の実装**（約1時間）
7. **フロントエンドの更新**（約30分）
8. **テスト**（約30分）

**合計所要時間**: 約3-4時間

---

## 📚 参考資料

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
