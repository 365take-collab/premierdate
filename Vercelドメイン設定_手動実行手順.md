# Vercelドメイン設定 - 手動実行手順（ブラウザ版）

## 🎯 目標

`premierdate.jp` をVercelプロジェクトに設定し、本番環境で使用できるようにする。

---

## 📋 設定手順（所要時間: 約10分）

### ステップ1: Vercelにログイン

1. **ブラウザでVercelにアクセス**: https://vercel.com/
2. **ログイン**: GitHubアカウントでログイン
3. **ダッシュボードを開く**: https://vercel.com/dashboard

---

### ステップ2: プロジェクトを選択

1. **プロジェクト一覧**から `premier-date` を選択
   - プロジェクトが見つからない場合は、GitHubリポジトリから新規プロジェクトを作成

---

### ステップ3: ドメインを追加

1. **Settings** タブをクリック
2. **Domains** セクションを開く
3. **Add Domain** ボタンをクリック
4. **ドメイン名を入力**: `premierdate.jp`
5. **Add** ボタンをクリック

#### 3-1. ネームサーバー情報を確認

Vercelが以下のようなネームサーバー情報を表示します：

```
ネームサーバー:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

**この情報をコピーしておきます**（次のステップで使用）

---

### ステップ4: ドメイン取得サービスでネームサーバーを設定

#### 4-1. ドメイン取得サービスの管理画面にログイン

**お名前.comの場合**:
1. **お名前.comにログイン**: https://www.onamae.com/
2. **ドメイン一覧** → **premierdate.jp** を選択
3. **ネームサーバー設定** を開く

**ムームードメインの場合**:
1. **ムームードメインにログイン**: https://muumuu-domain.com/
2. **ドメイン一覧** → **premierdate.jp** を選択
3. **ネームサーバー設定** を開く

**バリュードメインの場合**:
1. **バリュードメインにログイン**: https://www.value-domain.com/
2. **ドメイン一覧** → **premierdate.jp** を選択
3. **ネームサーバー設定** を開く

#### 4-2. ネームサーバーを変更

1. **ネームサーバー設定** で **カスタムネームサーバー** を選択
2. **Vercelのネームサーバーを入力**:
   - **ネームサーバー1**: `ns1.vercel-dns.com`
   - **ネームサーバー2**: `ns2.vercel-dns.com`
3. **保存** ボタンをクリック

#### 4-3. 設定の反映確認

- **反映時間**: 通常24-48時間以内に反映されます
- **確認方法**: Vercelの管理画面でドメインの状態を確認

---

### ステップ5: Vercel環境変数を設定

1. **Vercelダッシュボード** → **Settings** → **Environment Variables** に移動
2. 以下の環境変数を追加：

#### 5-1. NEXTAUTH_URL

1. **Add New** ボタンをクリック
2. **Key**: `NEXTAUTH_URL`
3. **Value**: `https://premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
5. **Save** ボタンをクリック

#### 5-2. NEXT_PUBLIC_BASE_URL

1. **Add New** ボタンをクリック
2. **Key**: `NEXT_PUBLIC_BASE_URL`
3. **Value**: `https://premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
5. **Save** ボタンをクリック

#### 5-3. SMTP_FROM

1. **Add New** ボタンをクリック
2. **Key**: `SMTP_FROM`
3. **Value**: `noreply@premierdate.jp`
4. **Environment**: **Production** を選択（✅チェック）
5. **Save** ボタンをクリック

#### 5-4. 環境変数の確認

以下の環境変数が設定されているか確認：

- ✅ `NEXTAUTH_URL` = `https://premierdate.jp` (Production)
- ✅ `NEXT_PUBLIC_BASE_URL` = `https://premierdate.jp` (Production)
- ✅ `SMTP_FROM` = `noreply@premierdate.jp` (Production)

---

### ステップ6: デプロイを再実行（環境変数を反映）

環境変数を追加した後、デプロイを再実行して変更を反映します：

1. **Deployments** タブを開く
2. 最新のデプロイメントの **...** メニューをクリック
3. **Redeploy** を選択
4. デプロイが完了するまで待つ（数分）

または、GitHubにプッシュして自動デプロイをトリガー：

```bash
cd /Users/kawamuratakeshi/Cursor/premier-date
git add .
git commit -m "ドメイン設定を追加"
git push
```

---

### ステップ7: ドメインの反映確認

#### 7-1. Vercelダッシュボードで確認

1. **Settings** → **Domains** → **premierdate.jp**
2. **ドメインの状態** を確認
   - ✅ **Valid**: 正常に設定完了
   - ⏳ **Pending**: 設定中（反映待ち）
   - ❌ **Error**: エラー（設定を確認）

#### 7-2. コマンドラインで確認

```bash
# DNSレコードの確認
nslookup premierdate.jp

# ネームサーバーの確認
dig NS premierdate.jp

# SSL証明書の確認
openssl s_client -connect premierdate.jp:443 -servername premierdate.jp
```

#### 7-3. ブラウザで確認

1. **ブラウザでアクセス**: `https://premierdate.jp`
2. **SSL証明書の確認**: ブラウザのアドレスバーで🔒マークを確認
3. **サイトが表示されるか確認**

---

## ✅ 設定完了チェックリスト

### ドメイン設定
- [ ] Vercelでドメインを追加
- [ ] ネームサーバーを設定（ドメイン取得サービス側）
- [ ] DNSレコードの確認（Vercelが自動設定）
- [ ] SSL証明書の発行確認（Vercelが自動発行）

### 環境変数設定
- [ ] `NEXTAUTH_URL` を `https://premierdate.jp` に設定（Production）
- [ ] `NEXT_PUBLIC_BASE_URL` を `https://premierdate.jp` に設定（Production）
- [ ] `SMTP_FROM` を `noreply@premierdate.jp` に設定（Production）

### デプロイ
- [ ] 環境変数を反映するためにデプロイを再実行

### 動作確認
- [ ] `https://premierdate.jp` でアクセスできる
- [ ] SSL証明書が有効（🔒マークが表示される）
- [ ] サイトが正常に表示される
- [ ] メール認証リンクが正しいドメインになっている
- [ ] 決済後のリダイレクトが正常に動作する

---

## 🐛 トラブルシューティング

### 問題1: ドメインが反映されない

**原因**:
- ネームサーバーの設定が間違っている
- DNSレコードの反映に時間がかかっている

**解決方法**:
1. **ネームサーバーの設定を確認**: Vercelのネームサーバーが正しく設定されているか確認
2. **反映時間を待つ**: 最大48時間待つ
3. **Vercelのサポートに問い合わせ**: https://vercel.com/support

### 問題2: SSL証明書が発行されない

**原因**:
- ドメインの所有権確認が完了していない
- DNSレコードの反映が完了していない

**解決方法**:
1. **DNSレコードの反映を確認**: `nslookup premierdate.jp` で確認
2. **Vercelの管理画面で再試行**: **Settings** → **Domains** → **premierdate.jp** → **Retry SSL**
3. **Vercelのサポートに問い合わせ**: https://vercel.com/support

### 問題3: メールリンクがlocalhostになっている

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. Vercelの環境変数を確認（`NEXTAUTH_URL`が`https://premierdate.jp`になっているか）
2. 本番環境（Production）に設定されているか確認
3. デプロイを再実行

### 問題4: 環境変数が反映されない

**原因**: デプロイが再実行されていない

**解決策**:
1. **Deployments** タブで最新のデプロイメントを確認
2. **Redeploy** を実行
3. または、GitHubにプッシュして自動デプロイをトリガー

---

## 🔗 参考リンク

### Vercel
- **Vercelダッシュボード**: https://vercel.com/dashboard
- **Vercelドメイン設定ガイド**: https://vercel.com/docs/concepts/projects/domains
- **Vercel環境変数設定**: https://vercel.com/docs/concepts/projects/environment-variables
- **Vercelサポート**: https://vercel.com/support

### ドメイン取得サービス
- **お名前.com**: https://www.onamae.com/
- **ムームードメイン**: https://muumuu-domain.com/
- **バリュードメイン**: https://www.value-domain.com/

### DNS確認ツール
- **DNS Checker**: https://dnschecker.org/
- **What's My DNS**: https://www.whatsmydns.net/

---

## 📝 メモ

### 設定情報

**ドメイン**: premierdate.jp
**Vercelプロジェクト**: premier-date
**ネームサーバー1**: ns1.vercel-dns.com
**ネームサーバー2**: ns2.vercel-dns.com

**環境変数（Production）**:
- `NEXTAUTH_URL` = `https://premierdate.jp`
- `NEXT_PUBLIC_BASE_URL` = `https://premierdate.jp`
- `SMTP_FROM` = `noreply@premierdate.jp`

---

**作成日**: 2025年12月31日
