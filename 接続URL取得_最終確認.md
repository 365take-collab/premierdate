# 接続URL取得の最終確認

## 確認していただきたいこと

現在、Database Settings画面を開いていますね。次に、**接続URL**を取得する必要があります。

### 手順

1. 現在開いている **Settings → Database** のページで、**上にスクロール**してください
2. ページの上部の方に、**「Connection string」** というセクションがあるはずです
3. そのセクションを開いてください

### 確認ポイント

「Connection string」セクションには、以下のような内容が表示されるはずです：

- **「URI」** タブ
- **「JDBC」** タブ（Java用）
- **「psql」** タブ（コマンドライン用）

**「URI」** タブを選択してください。

その下に、2つの選択肢がある場合があります：
- **「Direct connection」**（直接接続）
- **「Connection pooling」**（接続プーリング）

**「Direct connection」** を選択してください（重要！）

### 表示される接続URL

「Direct connection」のURIを選択すると、以下のような形式の接続URLが表示されるはずです：

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

または

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 重要な注意点

1. **「Direct connection」を選択する**（「Connection pooling」ではない）
2. 表示される接続URL全体をコピーする
3. `[PASSWORD]` や `[YOUR-PASSWORD]` というプレースホルダーが含まれている場合は、実際のパスワード `dateguide202512` に置き換える

---

## 接続URLが見つからない場合

もし「Connection string」セクションが見つからない場合は、以下の方法でも接続URLを取得できます：

### 方法1: プロジェクト概要ページから

1. 左メニューの **「Project Settings」** をクリック
2. **「API」** または **「Database」** セクションを開く
3. 接続URLが表示される場合があります

### 方法2: SQL Editorから

1. 左メニュー → **「SQL Editor」**
2. 新しいクエリを開く
3. 接続情報が表示される場合があります

---

**「Connection string」セクションを見つけて、表示される接続URL全体をコピーして教えてください！**



