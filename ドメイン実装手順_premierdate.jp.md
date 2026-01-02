# プレミアデート - ドメイン実装手順（premierdate.jp）

## ✅ ドメイン取得完了

**取得ドメイン**: `premierdate.jp`

---

## 📋 実装手順の全体フロー

```
1. コード側の設定完了 ✅
   ↓
2. Vercelでドメインを追加
   ↓
3. ネームサーバーを設定（ドメイン取得サービス側）
   ↓
4. 環境変数の設定（Vercel）
   ↓
5. DNSレコードの確認・設定
   ↓
6. SSL証明書の自動発行（Vercelが自動）
   ↓
7. ドメインの反映確認（24-48時間）
```

---

## ✅ ステップ1: コード側の設定（完了）

### 1-1. next.config.tsの更新

`next.config.ts`にドメイン設定を追加しました：

```typescript
images: {
  domains: ['premierdate.jp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'premierdate.jp',
    },
  ],
},
```

### 1-2. 環境変数のテンプレート

`.env.example`ファイルにドメイン関連の環境変数を追加しました。

**開発環境用（.env.local）**:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
SMTP_FROM="noreply@premierdate.jp"
```

**本番環境用（Vercel環境変数）**:
```env
NEXTAUTH_URL="https://premierdate.jp"
NEXT_PUBLIC_BASE_URL="https://premierdate.jp"
SMTP_FROM="noreply@premierdate.jp"
```

### 1-3. コード内のドメイン使用箇所

以下のファイルでドメイン関連の環境変数が使用されています：

- `src/app/api/auth/register-email/route.ts` - メール認証リンクの生成
- `src/app/api/subscription/create-checkout-session/route.ts` - 決済成功後のリダイレクトURL

---

## 🚀 ステップ2: Vercelでドメインを追加

### 2-1. Vercelにログイン

1. **Vercelにアクセス**: https://vercel.com/
2. **ログイン**: GitHubアカウントでログイン

### 2-2. プロジェクトを選択

1. **ダッシュボード**: https://vercel.com/dashboard
2. **プロジェクトを選択**: `premier-date` プロジェクトを選択

### 2-3. ドメインを追加

1. **Settings** → **Domains** を開く
2. **Add Domain** ボタンをクリック
3. **ドメイン名を入力**: `premierdate.jp`
4. **Add** ボタンをクリック

### 2-4. ネームサーバー情報を確認

Vercelが以下のようなネームサーバー情報を表示します：

```
ネームサーバー:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

**この情報をコピーしておきます**（次のステップで使用）

---

## 🔧 ステップ3: ドメイン取得サービスでネームサーバーを設定

### 3-1. ドメイン取得サービスの管理画面にログイン

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

### 3-2. ネームサーバーを変更

1. **ネームサーバー設定** で **カスタムネームサーバー** を選択
2. **Vercelのネームサーバーを入力**:
   - **ネームサーバー1**: `ns1.vercel-dns.com`
   - **ネームサーバー2**: `ns2.vercel-dns.com`
3. **保存** ボタンをクリック

### 3-3. 設定の反映確認

- **反映時間**: 通常24-48時間以内に反映されます
- **確認方法**: Vercelの管理画面でドメインの状態を確認

---

## 🔐 ステップ4: Vercel環境変数の設定

### 4-1. 環境変数の設定

1. **Vercelダッシュボード** → **Settings** → **Environment Variables** に移動
2. 以下の環境変数を追加：

```
NEXTAUTH_URL=https://premierdate.jp
NEXT_PUBLIC_BASE_URL=https://premierdate.jp
SMTP_FROM=noreply@premierdate.jp
```

**重要**: 本番環境（Production）に設定してください。

### 4-2. 環境変数の確認

以下の環境変数が設定されているか確認：

- ✅ `NEXTAUTH_URL` - メール認証リンク、決済後のリダイレクトなどで使用
- ✅ `NEXT_PUBLIC_BASE_URL` - クライアント側で使用
- ✅ `SMTP_FROM` - メール送信元アドレス

---

## 🔍 ステップ5: DNSレコードの確認（Vercelが自動設定）

### 5-1. Vercelが自動設定するDNSレコード

Vercelは以下のDNSレコードを自動的に設定します：

- **Aレコード**: VercelのIPアドレス
- **CNAMEレコード**: Vercelのドメイン
- **TXTレコード**: ドメイン所有権の確認用

**通常、手動で設定する必要はありません**（Vercelが自動設定）

### 5-2. カスタムDNSレコードが必要な場合

**メール送信が必要な場合**:
- **MXレコード**: メールサーバーの設定
- **SPFレコード**: メール送信元の認証
- **DKIMレコード**: メールの署名認証

**設定方法**:
1. Vercelの管理画面 → **Settings** → **Domains** → **premierdate.jp**
2. **DNS Records** タブを開く
3. 必要なDNSレコードを追加

---

## 🔒 ステップ6: SSL証明書の自動発行（Vercelが自動）

### 6-1. SSL証明書の自動発行

Vercelは **Let's Encrypt** を使用してSSL証明書を自動的に発行します。

**設定は不要**（自動的に発行されます）

### 6-2. SSL証明書の発行確認

1. **Vercelの管理画面** → **Settings** → **Domains** → **premierdate.jp**
2. **SSL証明書の状態** を確認
3. **発行完了** まで数分〜数時間かかる場合があります

---

## ✅ ステップ7: ドメインの反映確認

### 7-1. 反映時間の確認

- **ネームサーバーの反映**: 24-48時間以内
- **SSL証明書の発行**: 数分〜数時間
- **DNSレコードの反映**: 数時間〜24時間

### 7-2. 反映状況の確認方法

**方法1: Vercelの管理画面で確認**
1. **Settings** → **Domains** → **premierdate.jp**
2. **ドメインの状態** を確認
   - ✅ **Valid**: 正常に設定完了
   - ⏳ **Pending**: 設定中（反映待ち）
   - ❌ **Error**: エラー（設定を確認）

**方法2: コマンドラインで確認**

```bash
# DNSレコードの確認
nslookup premierdate.jp

# ネームサーバーの確認
dig NS premierdate.jp

# SSL証明書の確認
openssl s_client -connect premierdate.jp:443 -servername premierdate.jp
```

**方法3: ブラウザで確認**
1. **ブラウザでアクセス**: `https://premierdate.jp`
2. **SSL証明書の確認**: ブラウザのアドレスバーで🔒マークを確認
3. **サイトが表示されるか確認**

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

### 問題4: サブドメインを追加したい

**例**: `www.premierdate.jp` を追加したい場合

**設定方法**:
1. **Vercelの管理画面** → **Settings** → **Domains**
2. **Add Domain** ボタンをクリック
3. **ドメイン名を入力**: `www.premierdate.jp`
4. **Add** ボタンをクリック
5. **DNSレコードを設定**: `www` のCNAMEレコードを追加（Vercelが自動設定）

---

## 📊 設定完了後の確認チェックリスト

### ドメイン設定
- [ ] Vercelでドメインを追加
- [ ] ネームサーバーを設定（ドメイン取得サービス側）
- [ ] DNSレコードの確認（Vercelが自動設定）
- [ ] SSL証明書の発行確認（Vercelが自動発行）

### 環境変数設定
- [ ] `NEXTAUTH_URL` を `https://premierdate.jp` に設定
- [ ] `NEXT_PUBLIC_BASE_URL` を `https://premierdate.jp` に設定
- [ ] `SMTP_FROM` を `noreply@premierdate.jp` に設定
- [ ] 本番環境（Production）に設定されているか確認

### 動作確認
- [ ] `https://premierdate.jp` でアクセスできる
- [ ] SSL証明書が有効（🔒マークが表示される）
- [ ] サイトが正常に表示される
- [ ] メール認証リンクが正しいドメインになっている
- [ ] 決済後のリダイレクトが正常に動作する

### 追加設定（必要に応じて）
- [ ] サブドメインの追加（www.premierdate.jp など）
- [ ] メール送信の設定（MXレコード、SPFレコード、DKIMレコード）
- [ ] カスタムDNSレコードの追加

---

## 🔗 参考リンク

### Vercel
- **Vercelドメイン設定ガイド**: https://vercel.com/docs/concepts/projects/domains
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

### ドメイン情報
- **ドメイン名**: premierdate.jp
- **取得日**: 2025年12月30日
- **取得サービス**: [取得したサービス名を記入]
- **有効期限**: [有効期限を記入]

### Vercel設定情報
- **プロジェクト名**: premier-date
- **ネームサーバー1**: ns1.vercel-dns.com
- **ネームサーバー2**: ns2.vercel-dns.com

### 環境変数
- **NEXTAUTH_URL**: https://premierdate.jp
- **NEXT_PUBLIC_BASE_URL**: https://premierdate.jp
- **SMTP_FROM**: noreply@premierdate.jp

### 設定完了日
- **設定開始日**: [記入]
- **設定完了日**: [記入]
- **反映確認日**: [記入]

---

**作成日**: 2025年12月31日
**ドメイン**: premierdate.jp
**ホスティング**: Vercel
