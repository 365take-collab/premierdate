# 接続URLの再取得手順（重要）

## 手順

1. Supabaseダッシュボードで、`date-guide` プロジェクトを選択
2. 左メニューから **「Settings」**（⚙️アイコン）をクリック
3. **「Database」** をクリック
4. 下にスクロールして、**「Connection string」** セクションを開く
5. タブが2つあるはずです：
   - **「URI」** タブ
   - **「JDBC」** タブ
   - **「psql」** タブ（場合によって）
   
6. **「URI」** タブを選択
7. さらに、その下に2つの選択肢がある場合があります：
   - **「Direct connection」**（直接接続）
   - **「Connection pooling」**（接続プーリング）
   
8. **「Direct connection」** を選択（重要！）
9. 表示される接続URLをコピー

## 接続URLの形式

**Direct connection** のURIは、以下のような形式です：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Connection pooling** のURIは、以下のような形式です：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

**重要**: マイグレーションには **「Direct connection」** を使用してください。

## 現在の設定

現在、`.env` ファイルに設定されているURL：

```
postgresql://postgres:dateguide202512@db.alnqctmakkhlzwezfibj.supabase.co:5432/postgres
```

このURLが、Supabaseダッシュボードで表示される **「Direct connection」** のURIと一致しているか確認してください。

---

## パスワードのエスケープ（必要な場合）

パスワードに特殊文字が含まれている場合は、URLエンコードが必要です。

現在のパスワード: `dateguide202512`（特殊文字なし）→ エスケープ不要

もしパスワードに特殊文字（`@`, `:`, `/`, `%`, `#` など）が含まれる場合は、URLエンコードが必要です。

---

## 接続URLを取得したら

取得した接続URL全体をコピーして、以下を実行してください：

```bash
cd date-guide
# .envファイルを編集して、接続URLを更新
```

または、接続URL全体を教えていただければ、`.env` ファイルを自動で更新します！



