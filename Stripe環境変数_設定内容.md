# Stripe環境変数 設定内容

## ✅ 取得済み

### 公開可能キー（Publishable Key）
```
pk_live_REDACTED
```

### シークレットキー（Secret Key）
```
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
```

---

## ❌ まだ必要な情報

### 価格ID（Price ID）

1. **月額プランの価格ID**
   - Stripe Dashboard → 商品 → 「プレミアムプラン（月額）」をクリック
   - 「価格」セクションで `price_...` で始まるIDをコピー

2. **年額プランの価格ID**
   - Stripe Dashboard → 商品 → 「プレミアムプラン（年額）」をクリック
   - 「価格」セクションで `price_...` で始まるIDをコピー

---

## 📝 .envファイルの設定

`.env`ファイルに以下を追加してください：

```env
# Stripe API Keys（本番モード）
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_REDACTED

# Stripe Price IDs（価格IDを取得したら設定）
STRIPE_PRICE_ID_MONTHLY=price_ここに月額プランの価格IDを貼り付け
STRIPE_PRICE_ID_YEARLY=price_ここに年額プランの価格IDを貼り付け
```

---

## ⚠️ 重要: 本番モードについて

提供されたキーは**本番モード**です。以下の点に注意してください：

1. **実際の決済が発生します**
   - テストカードではなく、実際のカード情報で決済が行われます
   - 実際の金額が請求されます

2. **開発環境ではテストモードを推奨**
   - テストモード（`pk_test_...` と `sk_test_...`）を使用することを推奨します
   - テストモードでは実際の決済は発生しません

3. **セキュリティ**
   - シークレットキーは絶対に公開しないでください
   - `.env`ファイルは`.gitignore`に含まれていることを確認してください

---

## 🚀 次のステップ

1. **価格IDを取得**
   - Stripe Dashboard → 商品
   - 各商品の価格IDをコピー

2. **.envファイルに設定**
   - 上記の形式で追加

3. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

---

**価格IDを取得したら、お知らせください！**
