# Stripe環境変数設定ガイド

## ⚠️ 重要: 本番モードとテストモード

提供されたキーは **本番モード**（`pk_live_...`）です。

### 開発環境ではテストモードを使用することを推奨

- **テストモード**: `pk_test_...` と `sk_test_...` で始まるキー
  - 実際の決済は発生しません
  - テストカードで決済をテストできます
  - 安全に開発・テストできます

- **本番モード**: `pk_live_...` と `sk_live_...` で始まるキー
  - 実際の決済が発生します
  - 本番環境でのみ使用してください

---

## 📝 必要な情報

以下の情報を取得して、`.env`ファイルに設定してください：

### 1. 公開可能キー（Publishable Key）✅ 取得済み
```
pk_live_REDACTED
```

### 2. シークレットキー（Secret Key）❌ 未取得
- Stripe Dashboard → 開発者 → APIキー
- 「シークレットキー」セクションから `sk_live_...` を取得

### 3. 価格ID（Price ID）❌ 未取得
- Stripe Dashboard → 商品
- 作成した商品をクリック
- 「価格」セクションから `price_...` を取得
  - 月額プラン: `STRIPE_PRICE_ID_MONTHLY`
  - 年額プラン: `STRIPE_PRICE_ID_YEARLY`

### 4. Webhook署名シークレット（オプション）
- 開発環境: Stripe CLIを使用
- 本番環境: Stripe Dashboard → 開発者 → Webhook で設定

---

## 🔧 .envファイルの設定

`.env`ファイルに以下を追加：

```env
# Stripe API Keys（本番モード）
STRIPE_SECRET_KEY=sk_live_ここにシークレットキーを貼り付け
STRIPE_PUBLISHABLE_KEY=pk_live_REDACTED

# Stripe Price IDs
STRIPE_PRICE_ID_MONTHLY=price_ここに月額プランの価格IDを貼り付け
STRIPE_PRICE_ID_YEARLY=price_ここに年額プランの価格IDを貼り付け

# Webhook Secret（オプション）
STRIPE_WEBHOOK_SECRET=whsec_ここにWebhook署名シークレットを貼り付け
```

---

## 🧪 開発環境でテストする場合

開発環境で安全にテストする場合は、**テストモード**のキーを使用してください：

1. Stripe Dashboardで「テストモード」に切り替え（右上のトグルスイッチ）
2. テストモードのAPIキーを取得
3. `.env`ファイルに設定：

```env
# Stripe API Keys（テストモード）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

---

## ✅ 次のステップ

1. **シークレットキーを取得**
   - Stripe Dashboard → 開発者 → APIキー
   - 「シークレットキー」から `sk_live_...` をコピー

2. **価格IDを取得**
   - Stripe Dashboard → 商品
   - 作成した商品の価格IDをコピー

3. **.envファイルに設定**
   - 上記の形式で追加

4. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

---

**シークレットキーと価格IDを取得したら、お知らせください！**
