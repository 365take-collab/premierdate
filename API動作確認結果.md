# API動作確認結果

## 確認したエンドポイント

### 1. GET /api/restaurants

**目的**: 店舗一覧の取得

**テスト方法**:
```bash
curl http://localhost:3000/api/restaurants
```

**期待されるレスポンス**:
```json
{
  "restaurants": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

**現在の状態**: 
- データベースに店舗データがない場合は、空の配列が返されます
- エラーが発生しないことを確認

### 2. POST /api/auth/signup

**目的**: ユーザー登録

**テスト方法**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "テストユーザー"
  }'
```

**期待されるレスポンス（成功時）**:
```json
{
  "message": "アカウントが作成されました",
  "userId": "ユーザーID"
}
```

**期待されるレスポンス（エラー時）**:
```json
{
  "error": "エラーメッセージ"
}
```

### 3. GET /api/auth/[...nextauth]

**目的**: NextAuth.jsのエンドポイント

**テスト方法**:
```bash
curl http://localhost:3000/api/auth/providers
```

**期待されるレスポンス**:
NextAuth.jsが提供する認証プロバイダーの一覧

## 次のステップ

1. **ブラウザでの確認**: `http://localhost:3000` にアクセス
2. **認証機能のテスト**: ユーザー登録・ログイン機能の動作確認
3. **初期データの投入**: Prisma StudioまたはSQLでデータを追加



