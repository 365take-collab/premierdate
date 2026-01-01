# Stripe環境変数 最終設定

## ✅ 取得済みの情報

### 公開可能キー（Publishable Key）
```
[YOUR_STRIPE_PUBLISHABLE_KEY]
```
**⚠️ 注意**: 実際のキーは`.env`ファイルに設定してください。このファイルには含めません。

### シークレットキー（Secret Key）
```
[YOUR_STRIPE_SECRET_KEY]
```
**⚠️ 注意**: 実際のキーは`.env`ファイルに設定してください。このファイルには含めません。

### 価格ID（Price IDs）
```
price_1Siw0q3F2rtCunnnhA7Mrs7F
price_1Siw0E3F2rtCunnn51NOynry
```

---

## 📝 .envファイルへの設定

`.env`ファイルに以下を追加してください：

```env
# Stripe API Keys（本番モード）
# ⚠️ 実際のキーはStripe Dashboardから取得して設定してください
STRIPE_SECRET_KEY=[YOUR_STRIPE_SECRET_KEY]
STRIPE_PUBLISHABLE_KEY=[YOUR_STRIPE_PUBLISHABLE_KEY]

# Stripe Price IDs
# 注意: どちらが月額/年額かはStripe Dashboardで確認してください
STRIPE_PRICE_ID_MONTHLY=price_1Siw0q3F2rtCunnnhA7Mrs7F
STRIPE_PRICE_ID_YEARLY=price_1Siw0E3F2rtCunnn51NOynry
```

---

## 🔍 価格IDの確認方法

どちらが月額/年額かを確認するには：

1. Stripe Dashboard → 商品
2. 各商品をクリック
3. 「価格」セクションで価格と請求頻度を確認
   - 月額: ¥980 / 毎月
   - 年額: ¥8,800 / 毎年

必要に応じて、`STRIPE_PRICE_ID_MONTHLY` と `STRIPE_PRICE_ID_YEARLY` を入れ替えてください。

---

## ✅ 設定後の確認

1. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

2. **動作確認**
   - ブラウザで `http://localhost:3000/subscription` にアクセス
   - ログインしてプランを選択
   - Stripe Checkoutページが表示されることを確認

---

## ⚠️ 重要: 本番モードについて

現在の設定は**本番モード**です：

- **実際の決済が発生します**
- テストカードではなく、実際のカード情報で決済が行われます
- 実際の金額が請求されます

**開発環境でテストする場合は、テストモード（`pk_test_...` と `sk_test_...`）の使用を推奨します。**

---

## 🚀 次のステップ

1. `.env`ファイルに上記の設定を追加
2. 開発サーバーを再起動
3. `/subscription`ページで動作確認

**設定が完了したら、動作確認をしてください！**
