import 'dotenv/config'

// リライト関数をテストするためのスクリプト
// 元のレビューの内容を保ちながら、構成（文章の順序・組み合わせ）を変える
function naturalRewrite(originalText: string, restaurantName: string, restaurantArea: string): string {
  let text = originalText.trim()
  
  // まず、表現を軽く変える（最小限）
  text = text.replace(/訪れました/g, '訪問しました')
  text = text.replace(/行きました/g, '訪問しました')
  text = text.replace(/美味しかったです/g, '素晴らしい味わいでした')
  text = text.replace(/美味しかった。/g, '素晴らしい味わいでした。')
  text = text.replace(/美味しいです/g, '素晴らしい味わいです')
  text = text.replace(/美味しい。/g, '素晴らしい味わいです。')
  text = text.replace(/おいしかったです/g, '素晴らしい味わいでした')
  text = text.replace(/おいしかった。/g, '素晴らしい味わいでした。')
  text = text.replace(/おいしいです/g, '素晴らしい味わいです')
  text = text.replace(/おいしい。/g, '素晴らしい味わいです。')
  text = text.replace(/良かったです/g, '素晴らしかったです')
  text = text.replace(/よかったです/g, '素晴らしかったです')
  text = text.replace(/また、/g, 'さらに、')
  
  // 重複表現の修正
  text = text.replace(/ですです+/g, 'です')
  text = text.replace(/でしたです+/g, 'でした')
  text = text.replace(/でしたでした+/g, 'でした')
  text = text.replace(/\s+/g, ' ').trim()
  
  // 文章を分割（。！？で分割）
  const sentences = text.split(/([。！？])/).filter(s => s.trim().length > 0)
  const sentenceList: string[] = []
  
  // 文と句点を結合
  for (let i = 0; i < sentences.length; i += 2) {
    if (i + 1 < sentences.length) {
      sentenceList.push((sentences[i] + sentences[i + 1]).trim())
    } else if (sentences[i].trim()) {
      sentenceList.push(sentences[i].trim())
    }
  }
  
  if (sentenceList.length <= 1) {
    // 文が1つ以下の場合はそのまま返す
    return text
  }
  
  // 文を分類（訪問・料理・雰囲気・評価・推薦など）
  const visitSentences: string[] = [] // 訪問に関する文
  const foodSentences: string[] = [] // 料理に関する文
  const atmosphereSentences: string[] = [] // 雰囲気・サービスに関する文
  const evaluationSentences: string[] = [] // 評価・感想に関する文
  const recommendationSentences: string[] = [] // 推薦に関する文
  
  sentenceList.forEach(sentence => {
    const lower = sentence.toLowerCase()
    
    if (lower.includes('訪問') || lower.includes('行き') || lower.includes('訪れ') || 
        lower.includes('利用') || lower.includes('足を運') || lower.includes('記念') ||
        lower.includes('誕生日') || lower.includes('デート') || lower.includes('二人')) {
      visitSentences.push(sentence)
    } else if (lower.includes('美味') || lower.includes('味わい') || lower.includes('料理') || 
               lower.includes('メニュー') || lower.includes('お寿司') || lower.includes('握り') ||
               lower.includes('牡蠣') || lower.includes('盛り合わせ')) {
      foodSentences.push(sentence)
    } else if (lower.includes('雰囲気') || lower.includes('店内') || lower.includes('空間') ||
               lower.includes('スタッフ') || lower.includes('サービス') || lower.includes('接客') ||
               lower.includes('清潔') || lower.includes('明る') || lower.includes('落ち着')) {
      atmosphereSentences.push(sentence)
    } else if (lower.includes('おすすめ') || lower.includes('推薦') || lower.includes('また行き') ||
               lower.includes('ぜひ') || lower.includes('おすすめしたい')) {
      recommendationSentences.push(sentence)
    } else {
      evaluationSentences.push(sentence)
    }
  })
  
  // 構成を変える：複数のパターンから選択
  const patterns = [
    // パターン1: 訪問→評価→料理→雰囲気→推薦
    () => [...visitSentences, ...evaluationSentences, ...foodSentences, ...atmosphereSentences, ...recommendationSentences],
    // パターン2: 評価→訪問→料理→雰囲気→推薦
    () => [...evaluationSentences, ...visitSentences, ...foodSentences, ...atmosphereSentences, ...recommendationSentences],
    // パターン3: 訪問→料理→雰囲気→評価→推薦
    () => [...visitSentences, ...foodSentences, ...atmosphereSentences, ...evaluationSentences, ...recommendationSentences],
    // パターン4: 料理→訪問→雰囲気→評価→推薦
    () => [...foodSentences, ...visitSentences, ...atmosphereSentences, ...evaluationSentences, ...recommendationSentences],
    // パターン5: 訪問→雰囲気→料理→評価→推薦
    () => [...visitSentences, ...atmosphereSentences, ...foodSentences, ...evaluationSentences, ...recommendationSentences],
  ]
  
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)]
  const reorderedSentences = selectedPattern()
  
  // 空の配列を削除
  const finalSentences = reorderedSentences.filter(s => s && s.length > 0)
  
  // 文を結合（適切な接続詞を追加）
  let result = finalSentences[0] || ''
  for (let i = 1; i < finalSentences.length; i++) {
    const prev = finalSentences[i - 1]
    const curr = finalSentences[i]
    
    // 前の文の最後と現在の文の最初をチェックして、自然な接続にする
    if (prev && !prev.match(/[。！？]$/)) {
      result += '。'
    }
    
    // 接続詞が必要な場合に追加（ただし自然な場合のみ）
    if (i > 1 && Math.random() > 0.7) {
      const connectors = ['また、', 'さらに、', 'そして、']
      result += connectors[Math.floor(Math.random() * connectors.length)] + curr
    } else {
      result += curr
    }
  }
  
  // 最後の文に句点がない場合は追加
  if (result && !result.match(/[。！？]$/)) {
    result += '。'
  }
  
  return result.trim()
}

// テスト用のレビューサンプル
const testReviews = [
  'とっても美味しくて、お手頃価格でした。お店は明るく清潔で、気軽に入れる感じも素晴らしかったです。絶対また行きたい、生牡蠣も牡蠣フライも、本当に美味しいです。夫の誕生日のお祝いで行き、とても喜ばれました。',
  '彼女と2人でお昼に訪れました。14時ごろで、店内は空いていてすぐにテーブル席に案内されました。メニューは特上握り盛り合わせなど充実していて、とても美味しかったです。',
]

console.log('🧪 リライト関数のテスト\n')
console.log('='.repeat(80))

testReviews.forEach((review, index) => {
  console.log(`\n[テスト ${index + 1}]`)
  console.log('元のレビュー:')
  console.log(review)
  console.log('\nリライト後:')
  const rewritten = naturalRewrite(review, 'テストレストラン', '銀座')
  console.log(rewritten)
  console.log('\n' + '-'.repeat(80))
})
