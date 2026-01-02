# Vercel環境変数設定 - 手順

## ✅ 完了した作業

- [x] お名前.comでネームサーバーを設定
- [x] Vercelでドメインを追加

---

## 🚀 次のステップ: 環境変数を設定

### 方法A: Vercelダッシュボードで設定（推奨・簡単）

#### ステップ1: 環境変数設定画面を開く

1. **Vercelダッシュボード**: https://vercel.com/dashboard
2. **premier-date** プロジェクトを選択
3. **Settings** → **Environment Variables** に移動

#### ステップ2: NEXTAUTH_URL を追加

1. **Add New** ボタンをクリック
2. **Key**: `NEXTAUTH_URL`
3. **Value**: `https://premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
   - **Preview** と **Development** はチェックしない（開発環境では `localhost` を使用）
5. **Save** ボタンをクリック

#### ステップ3: NEXT_PUBLIC_BASE_URL を追加

1. **Add New** ボタンをクリック
2. **Key**: `NEXT_PUBLIC_BASE_URL`
3. **Value**: `https://premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
5. **Save** ボタンをクリック

#### ステップ4: SMTP_FROM を追加

1. **Add New** ボタンをクリック
2. **Key**: `SMTP_FROM`
3. **Value**: `noreply@premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
5. **Save** ボタンをクリック

#### ステップ5: 環境変数の確認

以下の環境変数が設定されているか確認：

- ✅ `NEXTAUTH_URL` = `https://premierdate.jp` (Production)
- ✅ `NEXT_PUBLIC_BASE_URL` = `https://premierdate.jp` (Production)
- ✅ `SMTP_FROM` = `noreply@premierdate.jp` (Production)

---

### 方法B: Vercel CLIで設定（上級者向け）

Vercel CLIがログイン済みの場合、以下のコマンドで設定できます：

```bash
cd /Users/kawamuratakeshi/Cursor/premier-date

# NEXTAUTH_URL を設定
vercel env add NEXTAUTH_URL production
# 入力: https://premierdate.jp

# NEXT_PUBLIC_BASE_URL を設定
vercel env add NEXT_PUBLIC_BASE_URL production
# 入力: https://premierdate.jp

# SMTP_FROM を設定
vercel env add SMTP_FROM production
# 入力: noreply@premierdate.jp
```

---

## 🚀 デプロイを再実行

環境変数を追加した後、デプロイを再実行して変更を反映します。

### 方法A: Vercelダッシュボードから再デプロイ

1. **Deployments** タブを開く
2. 最新のデプロイメントの **...** メニューをクリック
3. **Redeploy** を選択
4. デプロイが完了するまで待つ（数分）

### 方法B: GitHubから自動デプロイ（推奨）

```bash
cd /Users/kawamuratakeshi/Cursor/premier-date
git add .
git commit -m "ドメイン設定を追加"
git push
```

---

## ✅ 設定確認チェックリスト

### 環境変数設定
- [ ] `NEXTAUTH_URL` = `https://premierdate.jp` (Production)
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://premierdate.jp` (Production)
- [ ] `SMTP_FROM` = `noreply@premierdate.jp` (Production)

### デプロイ
- [ ] デプロイを再実行
- [ ] デプロイが成功したことを確認

### 動作確認（24-48時間後）
- [ ] `https://premierdate.jp` でアクセスできる
- [ ] SSL証明書が有効（🔒マークが表示される）
- [ ] サイトが正常に表示される
- [ ] メール認証リンクが正しいドメインになっている

---

## 🔗 参考リンク

- **Vercelダッシュボード**: https://vercel.com/dashboard
- **Vercel環境変数設定**: https://vercel.com/docs/concepts/projects/environment-variables

---

**更新日**: 2025年12月31日
