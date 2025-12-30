# HTML構造確認 - Elementsタブで直接確認

Elementsタブを開いて、HTMLコードを直接確認する方法です。

## 🎯 Elementsタブで確認する方法

### ステップ1: Elementsタブを選択

開発者ツールが開いたら、上部のタブから **「Elements」**（または「要素」）をクリックしてください。

### ステップ2: HTMLコードを確認

Elementsタブには、ページのHTMLコードが表示されています。

見た目はこんな感じです：

```
▼ <html>
  ▼ <body>
    ▼ <div class="container">
      ▼ <div class="hotel-list">
        ▼ <div class="hotel-item">
            <h2 class="hotel-name">ホテル名</h2>
            <p class="hotel-address">住所</p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
```

### ステップ3: 折りたたまれた部分を開く

`▶` や `▼` のマークがあります。これをクリックすると、折りたたまれているHTMLコードが開きます。

### ステップ4: ホテル関連のクラス名を探す

HTMLコードをスクロールしながら、以下のような文字列を探してください：

- `class="hotel-..."`
- `class="restaurant-..."`
- `class="item"`
- `class="list"`
- `class="card"`

見つけたら、そのクラス名をメモしてください。

## 💡 見つけやすい場所

- `<div class="...">` の `class="..."` の部分
- `<h2 class="...">` や `<h3 class="...">` の部分
- `<p class="...">` の部分

これらに `hotel`、`name`、`address` などの単語が含まれていることが多いです。

## 🔍 検索機能を使う

Elementsタブには検索機能もあります：

1. `Ctrl + F`（Windows/Linux）または `Cmd + F`（Mac）を押す
2. 検索ボックスに `class="hotel` と入力
3. ホテル関連のクラス名を一括で見つけられます

## 📝 メモする情報

見つけたクラス名を以下のようにメモしてください：

- ホテル一覧のコンテナ: `class="hotel-list"` など
- 各ホテルアイテム: `class="hotel-item"` など
- ホテル名: `class="hotel-name"` など
- 住所: `class="hotel-address"` など

## 🆘 分からない場合

HTMLコードをそのままスクリーンショットで送っていただいてもOKです。その情報から必要なクラス名を抽出します！



