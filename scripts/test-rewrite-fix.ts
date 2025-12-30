import 'dotenv/config'

// リライト関数（修正版）
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
  
  // 重複表現の修正（強化版）
  text = text.replace(/ですです+/g, 'です')
  text = text.replace(/でしたです+/g, 'でした')
  text = text.replace(/でしたでした+/g, 'でした')
  text = text.replace(/とってもとっても+/g, 'とっても') // 「とってもとっても」を削除
  text = text.replace(/とてもとても+/g, 'とても') // 「とてもとても」を削除
  text = text.replace(/本当に本当に+/g, '本当に') // 「本当に本当に」を削除
  text = text.replace(/素晴らしい素晴らしい+/g, '素晴らしい') // 「素晴らしい素晴らしい」を削除
  text = text.replace(/\s+/g, ' ').trim()
  
  // 文章を分割（。！？で分割）
  const sentences = text.split(/([。！？])/).filter(s => s.trim().length > 0)
  const sentenceList: string[] = []
  
  // 文と句点を結合
  for (let i = 0; i < sentences.length; i += 2) {
    if (i + 1 < sentences.length) {
      const combined = (sentences[i] + sentences[i + 1]).trim()
      // 不完全な文を除外（末尾が「...」や短すぎる文のみ）
      if (combined && combined.length >= 5 && !combined.endsWith('...') && !combined.endsWith('…')) {
        sentenceList.push(combined)
      }
    } else if (sentences[i].trim() && sentences[i].trim().length >= 5) {
      sentenceList.push(sentences[i].trim())
    }
  }
  
  if (sentenceList.length <= 1) {
    // 文が1つ以下の場合はそのまま返す
    return text
  }
  
  // 文を分類（訪問・料理・雰囲気・評価・推薦など）
  const visitSentences: string[] = []
  const foodSentences: string[] = []
  const atmosphereSentences: string[] = []
  const evaluationSentences: string[] = []
  const recommendationSentences: string[] = []
  
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
    () => [...visitSentences, ...evaluationSentences, ...foodSentences, ...atmosphereSentences, ...recommendationSentences],
    () => [...evaluationSentences, ...visitSentences, ...foodSentences, ...atmosphereSentences, ...recommendationSentences],
    () => [...visitSentences, ...foodSentences, ...atmosphereSentences, ...evaluationSentences, ...recommendationSentences],
    () => [...foodSentences, ...visitSentences, ...atmosphereSentences, ...evaluationSentences, ...recommendationSentences],
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
    
    // 前の文の最後に句点を確認・追加
    if (prev && !prev.match(/[。！？]$/)) {
      result += '。'
    }
    
    // 接続詞を追加（ただし、前の文が既に接続詞で終わっていない場合のみ）
    const prevEndsWithConnector = prev && prev.match(/(また|さらに|そして|また、|さらに、|そして、)[。！？]?$/)
    const currStartsWithConnector = curr.match(/^(また|さらに|そして|また、|さらに、|そして、)/)
    
    if (!prevEndsWithConnector && !currStartsWithConnector && i > 0) {
      // 2文目以降で、ランダムに接続詞を追加（確率を下げる）
      if (Math.random() > 0.8) {
        const connectors = ['また、', 'さらに、']
        result += connectors[Math.floor(Math.random() * connectors.length)] + curr
      } else {
        result += curr
      }
    } else {
      result += curr
    }
  }
  
  // 最後の文に句点がない場合は追加
  if (result && !result.match(/[。！？]$/)) {
    result += '。'
  }
  
  // 最終的な重複表現の再チェック
  result = result.replace(/とってもとっても+/g, 'とっても')
  result = result.replace(/とてもとても+/g, 'とても')
  result = result.replace(/ですです+/g, 'です')
  result = result.replace(/でしたです+/g, 'でした')
  
  return result.trim()
}

// ユーザーが指摘した問題のあるレビューをテスト
const problemReview = 'とってもとっても美味しかったし、お手頃価格でした。お店は明るく清潔で、気軽に入れる感じも素晴らしかったです。絶対また行きたい、生牡蠣も牡蠣フライも、本当に美味しいです。夫の誕生日のお祝いで行き、とても喜ばれました。'

console.log('🧪 問題のあるレビューのリライトテスト\n')
console.log('='.repeat(80))
console.log('元のレビュー:')
console.log(problemReview)
console.log('\n' + '-'.repeat(80))
console.log('リライト後:')
const rewritten = naturalRewrite(problemReview, 'テストレストラン', '銀座')
console.log(rewritten)
console.log('\n' + '='.repeat(80))
