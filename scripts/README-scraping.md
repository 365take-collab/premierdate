# ハッピーホテルサイトスクレイピング

ハッピーホテルサイト（https://happyhotel.jp/）からラブホテル情報をスクレイピングするスクリプトです。

## 必要な準備

### 1. 依存パッケージのインストール

```bash
npm install --save-dev playwright cheerio
npx playwright install chromium
```

### 2. 環境変数の設定（オプション）

`.env` ファイルに以下を追加（Geocoding APIを使用する場合）：

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 使用方法

```bash
tsx scripts/scrape-love-hotels.ts
```

## スクリプトの動作

1. 対象エリアのラブホテル情報をスクレイピング
   - 渋谷
   - 新宿
   - 池袋
   - 表参道（港区）
   - 恵比寿（港区）
   - 六本木（港区）
   - 銀座（港区）
   - 東京駅周辺

2. 各ホテルの情報を取得
   - ホテル名
   - 住所
   - 詳細ページのURL（あれば）

3. 住所からエリア名を自動推定

4. Geocoding APIで緯度・経度を取得（APIキーが設定されている場合）

5. 結果を `scripts/love-hotels.json` に保存

## 注意事項

### 利用規約の確認

ハッピーホテルサイトの利用規約を確認し、スクレイピングが許可されているか確認してください。

### HTML構造の確認

実際のHTML構造に合わせて、スクリプト内のセレクターを調整する必要があります：

```typescript
// TODO: 実際のHTML構造に合わせてセレクターを調整
$('.hotel-item').each((index, element) => {
  // ...
})
```

### レート制限

APIレート制限を避けるため、リクエスト間に適切な待機時間を設定しています。

## 次のステップ

スクレイピング完了後：

1. `scripts/love-hotels.json` を確認
2. 必要に応じて手動で修正（緯度・経度が取得できていない場合など）
3. `scripts/collect-shisha-bars-near-love-hotels.ts` を実行してシーシャバーを検索



