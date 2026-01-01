# Utage課金連携設定ガイド

## 概要

プレミアデートの課金システムをUtageと連携させるための設定ガイドです。

## 必要な設定

### 1. Utageでの決済ページ作成

1. **Utageにログイン**: https://utage.jp
2. **決済機能にアクセス**: 設定メニュー → 「決済機能」
3. **商品・サービスの作成**:
   - 商品名: プレミアデート
   - 商品説明: デートに特化した情報を提供するグルメ検索サービス

4. **プランの設定**:

   **月額プラン**:
   - プラン名: プレミアムプラン（月額）
   - 価格: 980円（税込）
   - 支払い頻度: 月額
   - 無料トライアル: 7日間（オプション）

   **年間プラン**:
   - プラン名: プレミアムプラン（年額）
   - 価格: 8,800円（税込）
   - 支払い頻度: 年額
   - 無料トライアル: 7日間（オプション）

5. **決済ページのURLを取得**:
   - Utageで決済ページを作成
   - 決済ページのURLをコピー
   - 例: `https://utage.jp/checkout/monthly`（月額）
   - 例: `https://utage.jp/checkout/yearly`（年額）

### 2. 環境変数の設定

`.env`ファイルまたはVercelの環境変数に以下を追加：

```env
# Utage決済ページURL
UTAGE_CHECKOUT_URL_MONTHLY=https://utage.jp/checkout/monthly
UTAGE_CHECKOUT_URL_YEARLY=https://utage.jp/checkout/yearly

# Utage会員ページURL（アクセス拒否時のリンクに使用）
UTAGE_MEMBER_URL=https://utage-system.com/member

# Utage Webhook設定
UTAGE_WEBHOOK_SECRET=your-webhook-secret-key

# Utage認証トークン（本番環境では必須）
UTAGE_TOKEN_SECRET=your-token-secret-key

# ⚠️ 開発環境用（本番環境では絶対に設定しないこと）
# UTAGE_ALLOW_DEV_LOGIN=true
# UTAGE_ALLOW_SIMPLE_LOGIN=true
# UTAGE_AUTO_CREATE_USER=true
```

### 3. Utage Webhookの設定

1. **UtageのWebhook設定にアクセス**:
   - Utageの設定メニュー → 「Webhook設定」
   - または: https://help.utage-system.com/archives/6789

2. **Webhook URLを設定**:
   ```
   https://your-domain.com/api/webhooks/utage
   ```
   - 本番環境: `https://premierdate.jp/api/webhooks/utage`
   - 開発環境: `https://your-app.vercel.app/api/webhooks/utage`

3. **Webhookシークレットを設定**:
   - Utageで生成されたシークレットキーをコピー
   - 環境変数`UTAGE_WEBHOOK_SECRET`に設定

4. **送信するイベントを選択**:
   - ✅ 決済完了
   - ✅ 決済キャンセル
   - ✅ 返金

### 4. Utage会員サイトの設定

1. **会員サイトのページを作成**:
   - Utageの設定メニュー → 「会員サイト」
   - 会員専用ページを作成

2. **ログインリンクの設定**:
   - 会員サイトのページに、プレミアデートへのログインリンクを設定
   - URL形式: `https://your-domain.com/auth/login-utage?email=%mail%&token=%token%`
   - または: `https://your-domain.com/auth/login-utage?email=%mail%`

3. **メールアドレス変数の確認**:
   - Utageの変数`%mail%`が正しく展開されることを確認
   - 必要に応じて、Utageの設定で変数の展開を有効化

## 動作確認

### 1. Webhookの動作確認

```bash
# Webhookエンドポイントが動作しているか確認
curl https://your-domain.com/api/webhooks/utage
```

期待される応答:
```json
{
  "status": "ok",
  "message": "Utage Webhook endpoint is ready",
  "endpoint": "/api/webhooks/utage"
}
```

### 2. 決済フローの確認

1. **サブスクリプションページにアクセス**: `/subscription`
2. **プランを選択**: 月額または年額プランをクリック
3. **Utage決済ページにリダイレクト**: Utageの決済ページが表示されることを確認
4. **決済完了**: Utageで決済を完了
5. **Webhookの確認**: サーバーログでWebhookが受信されているか確認
6. **プラン更新の確認**: ユーザーのプランが更新されているか確認

### 3. ログインの確認

1. **Utage会員サイトにアクセス**: Utageで設定した会員サイトのURL
2. **ログインリンクをクリック**: プレミアデートへのログインリンク
3. **自動ログイン**: プレミアデートに自動的にログインされることを確認

## トラブルシューティング

### 問題1: Webhookが受信されない

**解決方法**:
- UtageのWebhook設定でURLが正しいか確認
- Webhookシークレットが正しく設定されているか確認
- サーバーログでエラーを確認
- UtageのWebhook送信履歴を確認

### 問題2: 決済ページにリダイレクトされない

**解決方法**:
- 環境変数`UTAGE_CHECKOUT_URL_MONTHLY`と`UTAGE_CHECKOUT_URL_YEARLY`が設定されているか確認
- Utageの決済ページURLが正しいか確認
- ブラウザのコンソールでエラーを確認

### 問題3: ログインできない

**解決方法**:
- Utageの会員サイト設定で、メールアドレス変数`%mail%`が正しく展開されているか確認
- `/auth/login-utage`ページでエラーメッセージを確認
- サーバーログで認証エラーを確認

### 問題4: プランが更新されない

**解決方法**:
- Webhookが正しく受信されているか確認
- Webhookのペイロード形式が正しいか確認
- データベースでユーザーのプラン情報を確認
- サーバーログでエラーを確認

## 参考資料

- **Utage公式マニュアル**: https://help.utage-system.com/knowledge-allpages
- **Utage Webhook設定**: https://help.utage-system.com/archives/6789
- **Utage Stripe連携**: `生ファイル/SendRight/Utage関連/SendRight_Utage_Stripe連携設定ガイド.md`

## 次のステップ

1. ✅ Utageで決済ページを作成
2. ✅ 環境変数を設定
3. ✅ Webhookを設定
4. ✅ 会員サイトの設定
5. ✅ 動作確認
6. ⏳ 本番環境でのテスト
7. ⏳ メール配信の設定（オプション）
