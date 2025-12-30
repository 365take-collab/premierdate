# ハッピーホテルサイト - 確認済みHTML構造

## 📋 確認できた情報

### ホテル名

- **セレクター**: `h3.common-hotelList_name a.common-hotelList_name__text`
- **クラス名**: `.common-hotelList_name__text`
- **構造**: 
  ```html
  <h3 class="common-hotelList_name no-left no-right">
    <a class="common-hotelList_name__text">ホテル名</a>
  </h3>
  ```

### ホテル一覧

- **コンテナ**: `.common-hotelList`
- **各ホテルアイテム**: `.hotel_std` または `.hotel_light`
- **構造**:
  ```html
  <ul class="common-hotelList">
    <li class="hotel_std">
      <h3 class="common-hotelList_name">
        <a class="common-hotelList_name__text">ホテル名</a>
      </h3>
      <!-- その他の情報 -->
    </li>
  </ul>
  ```

### 詳細ページURL

- **取得方法**: `h3.common-hotelList_name a.common-hotelList_name__text` の `href` 属性
- **形式**: 相対パスまたは絶対パス

## ✅ 住所の構造（確認済み）

### 住所

- **セレクター**: `p.common-hotelList_address span.txt`
- **クラス名**: `.common-hotelList_address .txt`
- **構造**:
  ```html
  <p class="common-hotelList_address">
    <a>
      <span class="txt">東京都港区六本木7-20-7</span>
    </a>
  </p>
  ```

### その他の情報

- 価格情報
- 駅からの距離
- 画像URL

## 🔧 スクリプトの修正状況

- ✅ ホテル名の取得: 実装済み
- ✅ ホテル一覧のループ: 実装済み
- ✅ 住所の取得: 実装済み（`p.common-hotelList_address span.txt`）
- ✅ URLの取得: 実装済み
- ✅ エリアURLの生成: 実装済み

## 📝 次のステップ

1. スクリプトをテスト実行
2. 必要に応じてセレクターを微調整
3. Geocoding APIの統合（緯度・経度の取得）

