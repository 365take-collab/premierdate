# シーシャバー収集スクリプト

ハッピーホテルサイト（https://happyhotel.jp/）に掲載されているラブホテルから100m以内のシーシャバーを検索してデータベースに追加するスクリプトです。

## 使用方法

### 1. ラブホテル情報の取得方法

#### 方法A: 手動でリストを提供

`scripts/collect-shisha-bars-near-love-hotels.ts` の `loveHotels` 配列に直接追加：

```typescript
const loveHotels: LoveHotel[] = [
  {
    name: 'ホテル名',
    address: '東京都渋谷区...',
    latitude: 35.658034,
    longitude: 139.701636,
    area: '渋谷',
  },
  // ...
]
```

#### 方法B: ハッピーホテルサイトから手動で取得

1. https://happyhotel.jp/ にアクセス
2. エリアを選択（例：東京 > 渋谷）
3. 各ラブホテルの名前と住所を取得
4. 住所から緯度・経度を取得（Geocoding API使用、または手動でマップから取得）

#### 方法C: スクレイピング（実装予定）

- 利用規約の確認が必要
- 実装後、自動でラブホテル情報を取得

### 2. Google Places APIの設定

`.env` ファイルに以下を追加：

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

Google Cloud Console で Places API を有効化する必要があります。

### 3. スクリプトの実行

```bash
tsx scripts/collect-shisha-bars-near-love-hotels.ts
```

## データ構造

### LoveHotel インターフェース

```typescript
interface LoveHotel {
  name: string           // ラブホテル名
  address: string        // 住所
  latitude: number       // 緯度
  longitude: number      // 経度
  area: string           // エリア名（渋谷、新宿など）
}
```

### ShishaBar インターフェース

```typescript
interface ShishaBar {
  name: string                    // 店舗名
  address: string                 // 住所
  latitude: number                // 緯度
  longitude: number               // 経度
  area: string                    // エリア名
  priceRange: PriceRange          // 価格帯
  atmosphere: string              // 雰囲気
  customerSegment: string         // 客層
  sideBySideSeats: boolean        // 横並び席の有無
  hotelDistanceWalk: number       // ホテルまでの距離（メートル）
  hotelDistanceTrain: number | null // 電車での距離（分）
  description: string             // 説明文
  purposeCategoryNames: string[]  // 用途カテゴリ名の配列
}
```

## TODO

- [ ] Google Places APIの統合
- [ ] Google Geocoding APIの統合
- [ ] ハッピーホテルサイトからのスクレイピング実装
- [ ] CSVファイルからの読み込み機能
- [ ] シーシャバーの詳細情報の自動取得（価格帯、雰囲気など）



