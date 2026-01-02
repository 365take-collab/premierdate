# Vercelドメイン設定 - 自動実行スクリプト

## 前提条件

1. Vercel CLIがインストールされている ✅
2. Vercelアカウントにログインしている
3. プロジェクトがVercelにデプロイされている

## 実行手順

### ステップ1: Vercelにログイン

```bash
cd /Users/kawamuratakeshi/Cursor/premier-date
vercel login
```

ブラウザが開いて、Vercelアカウントでログインします。

### ステップ2: プロジェクトを確認

```bash
vercel projects
```

`premier-date` プロジェクトが表示されることを確認します。

### ステップ3: ドメインを追加

```bash
vercel domains add premierdate.jp
```

### ステップ4: 環境変数を設定

```bash
# 本番環境の環境変数を設定
vercel env add NEXTAUTH_URL production
# 入力: https://premierdate.jp

vercel env add NEXT_PUBLIC_BASE_URL production
# 入力: https://premierdate.jp

vercel env add SMTP_FROM production
# 入力: noreply@premierdate.jp
```

### ステップ5: ネームサーバー情報を確認

```bash
vercel domains inspect premierdate.jp
```

ネームサーバー情報が表示されます：
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

この情報をドメイン取得サービスの管理画面で設定します。

## 手動設定が必要な項目

### 1. ドメイン取得サービスでネームサーバーを設定

ドメイン取得サービスの管理画面で：
1. **ドメイン一覧** → **premierdate.jp** を選択
2. **ネームサーバー設定** を開く
3. **カスタムネームサーバー** を選択
4. 以下のネームサーバーを入力：
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. **保存** ボタンをクリック

### 2. 反映確認

24-48時間以内に反映されます。以下のコマンドで確認：

```bash
# DNSレコードの確認
nslookup premierdate.jp

# ネームサーバーの確認
dig NS premierdate.jp
```

## トラブルシューティング

### 問題: ログインできない

**解決策**: ブラウザで手動ログイン
1. https://vercel.com/ にアクセス
2. GitHubアカウントでログイン
3. 再度 `vercel login` を実行

### 問題: プロジェクトが見つからない

**解決策**: プロジェクトをリンク
```bash
vercel link
```

### 問題: ドメインが追加できない

**解決策**: Vercelダッシュボードで手動追加
1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. **Settings** → **Domains** → **Add Domain**
4. `premierdate.jp` を入力
