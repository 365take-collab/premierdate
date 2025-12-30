# Supabaseプロジェクトの状態確認方法

## 確認方法

### Step 1: Supabaseダッシュボードにログイン

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. ログイン（GitHubアカウントまたはメールアドレス）

### Step 2: プロジェクトを選択

1. ダッシュボードの左側にプロジェクト一覧が表示されます
2. **`date-guide`** という名前のプロジェクトをクリック

### Step 3: プロジェクトの状態を確認

#### 方法1: プロジェクト名の横を確認

プロジェクトを選択すると、画面上部にプロジェクト名が表示されます。

- **緑色のインジケーター（●）が表示されている** → プロジェクトは起動中（Active）
- **黄色またはオレンジ色のインジケーター** → 起動中（Setting up）
- **赤色のインジケーター** → エラーが発生している可能性

#### 方法2: Table Editorで確認（最も確実）

1. 左メニューから **「Table Editor」** をクリック
2. 以下のいずれかが表示されます：

   **✅ 起動済みの場合**:
   - 「Create a new table」というボタンが表示される
   - または、既存のテーブル一覧が表示される
   - → **これが表示されれば、プロジェクトは起動しています！**

   **⏳ 起動中の場合**:
   - 「Setting up your project...」や「Database is starting...」というメッセージが表示される
   - → **この場合は、完了するまで待ってください（通常2-3分）**

   **❌ エラーの場合**:
   - エラーメッセージが表示される
   - → **エラー内容を確認してください**

#### 方法3: Databaseのページで確認

1. 左メニューから **「Settings」**（⚙️アイコン）をクリック
2. **「Database」** をクリック
3. ページが正常に表示されれば、プロジェクトは起動しています

---

## 確認結果に応じた対応

### ✅ プロジェクトが起動している場合

→ データベースマイグレーションを実行できます：

```bash
cd date-guide
npm run db:migrate
```

### ⏳ プロジェクトが起動中の場合

→ 数分待ってから、再度確認してください。

プロジェクト作成直後は、以下のような表示がされることがあります：
- 「Setting up your project...」
- 「Database is starting...」
- 「Provisioning your database...」

通常、2-5分程度で完了します。

### ❌ エラーが表示される場合

→ エラーメッセージの内容を確認し、必要に応じてサポートに問い合わせてください。

---

## 接続URLの再確認（起動済みの場合）

プロジェクトが起動していることが確認できたら、接続URLを再取得してください：

1. 左メニュー → **「Settings」** → **「Database」**
2. **「Connection string」** セクションを開く
3. **「URI」** タブを選択
4. 表示される接続URLをコピー

**重要**: 「Direct connection」のURIを使用してください（「Connection pooling」ではありません）。

接続URLの形式:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

現在の設定では:
```
postgresql://postgres:dateguide202512@db.alnqctmakkhlzwezfibj.supabase.co:5432/postgres
```

このURLが表示されるURIと一致しているか確認してください。

---

## 確認のポイント（まとめ）

1. **プロジェクト名の横に緑色のインジケーターがあるか**
2. **Table Editorが開けるか**（「Create a new table」が表示されるか）
3. **Settings → Database のページが表示されるか**

これらのいずれかが確認できれば、プロジェクトは起動しています！

---

**確認できたら、結果を教えてください。次のステップに進みます！**



