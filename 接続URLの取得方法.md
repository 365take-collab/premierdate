# Supabase接続URLの取得方法

## 手順

1. [Supabase](https://supabase.com/dashboard) のダッシュボードにログイン
2. `date-guide` プロジェクトを選択
3. 左メニューから「Settings」（⚙️アイコン）をクリック
4. 「Database」を選択
5. 「Connection string」セクションを開く
6. 「URI」タブを選択
7. 表示される接続URLをコピー

## 接続URLの形式

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**パスワード**: `dateguide202512`（既に設定済み）

**例**:
```
postgresql://postgres:dateguide202512@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**重要**: 
- `[PROJECT-REF]` の部分（`abcdefghijklmnop` の部分）は、あなたのSupabaseプロジェクト固有の文字列です
- この文字列をコピーして、`.env` ファイルの `DATABASE_URL` に設定してください

## 接続URLを取得したら

接続URL全体をコピーして、以下のコマンドを実行してください：

```bash
cd premier-date
# 接続URLを .env ファイルに設定（手動で編集するか、以下のコマンドで設定）
```

または、接続URL全体を教えていただければ、`.env` ファイルを自動で作成します！



