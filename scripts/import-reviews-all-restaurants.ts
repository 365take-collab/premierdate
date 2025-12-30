import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

interface ExternalReview {
  restaurantName: string
  rating: number
  reviewText: string
  reviewDate?: Date // レビューの投稿日付
}

// デート関連キーワード
const DATE_KEYWORDS = [
  'デート', 'カップル', '記念日', '誕生日', '二人', '恋人', 
  '彼女', '彼氏', '特別な日', '記念'
]

// レビューの投稿日付をパース
function parseReviewDate(dateText: string): Date | null {
  if (!dateText) return null
  
  try {
    // 「2024年12月28日」形式
    const match1 = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match1) {
      const year = parseInt(match1[1])
      const month = parseInt(match1[2]) - 1 // 月は0-11
      const day = parseInt(match1[3])
      return new Date(year, month, day)
    }
    
    // 「2024/12/28」形式
    const match2 = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (match2) {
      const year = parseInt(match2[1])
      const month = parseInt(match2[2]) - 1
      const day = parseInt(match2[3])
      return new Date(year, month, day)
    }
    
    // 「12/28」形式（年がない場合は今年とする）
    const match3 = dateText.match(/(\d{1,2})\/(\d{1,2})/)
    if (match3) {
      const now = new Date()
      const year = now.getFullYear()
      const month = parseInt(match3[1]) - 1
      const day = parseInt(match3[2])
      return new Date(year, month, day)
    }
    
    // ISO形式やその他の形式
    const parsed = new Date(dateText)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  } catch (error) {
    // パースエラーは無視
  }
  
  return null
}

// デート関連レビューのチェック
function isDateRelatedReview(text: string): boolean {
  return DATE_KEYWORDS.some(keyword => text.includes(keyword))
}

// 元のレビューを要約してからリライトする
function naturalRewrite(originalText: string, restaurantName: string, restaurantArea: string): string {
  let text = originalText.trim()
  
  // まず、重複表現や不完全な部分を削除
  text = text.replace(/ですです+/g, 'です')
  text = text.replace(/でしたです+/g, 'でした')
  text = text.replace(/でしたでした+/g, 'でした')
  text = text.replace(/とってもとっても+/g, 'とっても')
  text = text.replace(/とてもとても+/g, 'とても')
  text = text.replace(/本当に本当に+/g, '本当に')
  text = text.replace(/素晴らしい素晴らしい+/g, '素晴らしい')
  text = text.replace(/\s+/g, ' ').trim()
  
  // 不完全な文を削除（「喜...。」のような途中で切れた文）
  const sentences = text.split(/([。！？])/).filter(s => s.trim().length > 0)
  const validSentences: string[] = []
  
  for (let i = 0; i < sentences.length; i += 2) {
    if (i + 1 < sentences.length) {
      const sentence = (sentences[i] + sentences[i + 1]).trim()
      // 不完全な文を除外
      if (sentence && sentence.length >= 5 && 
          !sentence.endsWith('...') && !sentence.endsWith('…') &&
          !sentence.match(/[喜悲楽][^。！？]{0,2}[。！？]$/) &&
          !sentence.match(/(とっても|とても)[^。！？]*[喜悲楽][^。！？]{0,2}[。！？]$/)) {
        validSentences.push(sentence)
      }
    }
  }
  
  if (validSentences.length === 0) {
    return text // 有効な文がない場合は元のテキストを返す
  }
  
  // 要約：各文から重要な情報を抽出
  const summary: {
    visit?: string
    food?: string[]
    atmosphere?: string
    evaluation?: string
    recommendation?: string
  } = {}
  
  validSentences.forEach(sentence => {
    const lower = sentence.toLowerCase()
    
    if (lower.includes('訪問') || lower.includes('行き') || lower.includes('訪れ') || 
        lower.includes('利用') || lower.includes('足を運') || lower.includes('記念') ||
        lower.includes('誕生日') || lower.includes('デート') || lower.includes('二人')) {
      summary.visit = sentence
    } else if (lower.includes('美味') || lower.includes('味わい') || lower.includes('料理') || 
               lower.includes('メニュー') || lower.includes('お寿司') || lower.includes('握り') ||
               lower.includes('牡蠣') || lower.includes('盛り合わせ')) {
      if (!summary.food) summary.food = []
      summary.food.push(sentence)
    } else if (lower.includes('雰囲気') || lower.includes('店内') || lower.includes('空間') ||
               lower.includes('スタッフ') || lower.includes('サービス') || lower.includes('接客') ||
               lower.includes('清潔') || lower.includes('明る') || lower.includes('落ち着')) {
      summary.atmosphere = sentence
    } else if (lower.includes('おすすめ') || lower.includes('推薦') || lower.includes('また行き') ||
               lower.includes('ぜひ') || lower.includes('おすすめしたい')) {
      summary.recommendation = sentence
    } else {
      summary.evaluation = sentence
    }
  })
  
  // 要約から自然なレビューを再構成
  const parts: string[] = []
  
  // 訪問情報
  if (summary.visit) {
    parts.push(summary.visit)
  }
  
  // 料理情報（最大2つまで）
  if (summary.food && summary.food.length > 0) {
    parts.push(...summary.food.slice(0, 2))
  }
  
  // 雰囲気情報
  if (summary.atmosphere) {
    parts.push(summary.atmosphere)
  }
  
  // 評価情報
  if (summary.evaluation) {
    parts.push(summary.evaluation)
  }
  
  // 推薦情報
  if (summary.recommendation) {
    parts.push(summary.recommendation)
  }
  
  // 文を結合してリライト
  let result = ''
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      // 前の文の最後に句点がない場合は追加
      const prev = parts[i - 1]
      if (prev && !prev.match(/[。！？]$/)) {
        result += '。'
      }
    }
    result += parts[i]
  }
  
  // 表現を軽く変える
  result = result.replace(/訪れました/g, '訪問しました')
  result = result.replace(/行きました/g, '訪問しました')
  result = result.replace(/美味しかったです/g, '素晴らしい味わいでした')
  result = result.replace(/美味しかった。/g, '素晴らしい味わいでした。')
  result = result.replace(/美味しいです/g, '素晴らしい味わいです')
  result = result.replace(/美味しい。/g, '素晴らしい味わいです。')
  result = result.replace(/おいしかったです/g, '素晴らしい味わいでした')
  result = result.replace(/おいしかった。/g, '素晴らしい味わいでした。')
  result = result.replace(/おいしいです/g, '素晴らしい味わいです')
  result = result.replace(/おいしい。/g, '素晴らしい味わいです。')
  result = result.replace(/良かったです/g, '素晴らしかったです')
  result = result.replace(/よかったです/g, '素晴らしかったです')
  result = result.replace(/また、/g, 'さらに、')
  
  // 最終的な重複表現の削除
  result = result.replace(/ですです+/g, 'です')
  result = result.replace(/でしたです+/g, 'でした')
  result = result.replace(/でしたでした+/g, 'でした')
  result = result.replace(/とってもとっても+/g, 'とっても')
  result = result.replace(/とてもとても+/g, 'とても')
  
  // 不完全な表現の削除
  result = result.replace(/[とってもとても]+[^。！？]*[喜悲楽][^。！？]{0,2}[。！？]/g, '')
  
  // 最後に整形
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

// Google検索で食べログURLを検索（ボット判定回避版）
async function searchTabelogUrl(page: any, restaurantName: string, area: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${restaurantName} 食べログ`)
    const googleUrl = `https://www.google.com/search?hl=ja&q=${query}`
    
    console.log(`  🔍 Google検索: 「${restaurantName} 食べログ」...`)
    
    // より人間らしくアクセス
    await page.goto(googleUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    // ランダムな待機時間（2-4秒）
    const waitTime = 2000 + Math.random() * 2000
    console.log(`  ⏳ ${Math.round(waitTime)}ms待機中...`)
    await page.waitForTimeout(waitTime)
    
    // 同意ボタンがあればクリック
    try {
      const acceptButton = await page.locator('button:has-text("すべて同意"), button:has-text("同意"), button:has-text("Accept all")').first()
      if (await acceptButton.isVisible({ timeout: 3000 })) {
        console.log(`  ✅ 同意ボタンをクリック`)
        await acceptButton.click()
        await page.waitForTimeout(1000 + Math.random() * 1000)
      }
    } catch {
      // 同意ボタンがなければスキップ
    }
    
    // スクロールして人間らしい動きをシミュレート
    await page.evaluate(() => {
      window.scrollBy(0, 300 + Math.random() * 200)
    })
    await page.waitForTimeout(500 + Math.random() * 500)
    
    // ページのHTMLを取得
    const html = await page.content()
    const pageTitle = await page.title()
    console.log(`  📄 ページタイトル: ${pageTitle}`)
    
    // reCAPTCHAチェック
    if (html.includes('reCAPTCHA') || html.includes('このページについて') || pageTitle.includes('search?')) {
      console.log(`  ⚠️  Google検索がブロックされました（reCAPTCHA）`)
      return null
    }
    
    // リンクを取得
    const links = await page.$$eval('a', (anchors: any[]) =>
      anchors.map((a) => a.href).filter((href: string) => href && href.length > 0)
    )
    
    console.log(`  📊 取得したリンク数: ${links.length}`)
    
    // 食べログのリンクを探す
    let foundCount = 0
    for (const link of links) {
      if (link.includes('tabelog.com')) {
        foundCount++
        console.log(`  🔗 食べログリンク[${foundCount}]: ${link.substring(0, 100)}...`)
        
        // Google検索結果の/url?q=...形式からURLを抽出
        let tabelogUrl = link
        if (link.includes('/url?')) {
          try {
            const url = new URL(link)
            tabelogUrl = url.searchParams.get('q') || link
          } catch {
            continue
          }
        }
        
        // s.tabelog.com（短縮URL）を通常のURLに変換
        if (tabelogUrl.includes('s.tabelog.com')) {
          tabelogUrl = tabelogUrl.replace('s.tabelog.com', 'tabelog.com')
        }
        
        // 食べログの店舗URLパターンにマッチするか確認
        const match = tabelogUrl.match(/(https?:\/\/tabelog\.com\/[a-z]+\/A\d+\/A\d+\/\d+\/?)/)
        if (match) {
          console.log(`  ✅ 食べログURL発見: ${match[1]}`)
          return match[1]
        }
      }
    }
    
    console.log(`  ⚠️  食べログURLが見つかりませんでした（食べログリンク数: ${foundCount}）`)
    return null
  } catch (error) {
    console.log(`  ⚠️  検索エラー: ${error}`)
    return null
  }
}

// Google検索でグルナビURLを検索（ボット判定回避版）
async function searchGurunaviUrl(page: any, restaurantName: string, area: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${restaurantName} ぐるなび`)
    const googleUrl = `https://www.google.com/search?hl=ja&q=${query}`
    
    console.log(`  🔍 Google検索: 「${restaurantName} ぐるなび」...`)
    
    // より人間らしくアクセス
    await page.goto(googleUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    // ランダムな待機時間（2-4秒）
    const waitTime = 2000 + Math.random() * 2000
    console.log(`  ⏳ ${Math.round(waitTime)}ms待機中...`)
    await page.waitForTimeout(waitTime)
    
    // 同意ボタンがあればクリック
    try {
      const acceptButton = await page.locator('button:has-text("すべて同意"), button:has-text("同意"), button:has-text("Accept all")').first()
      if (await acceptButton.isVisible({ timeout: 3000 })) {
        console.log(`  ✅ 同意ボタンをクリック`)
        await acceptButton.click()
        await page.waitForTimeout(1000 + Math.random() * 1000)
      }
    } catch {
      // 同意ボタンがなければスキップ
    }
    
    // スクロールして人間らしい動きをシミュレート
    await page.evaluate(() => {
      window.scrollBy(0, 300 + Math.random() * 200)
    })
    await page.waitForTimeout(500 + Math.random() * 500)
    
    // ページのHTMLを取得
    const html = await page.content()
    const pageTitle = await page.title()
    console.log(`  📄 ページタイトル: ${pageTitle}`)
    
    // reCAPTCHAチェック
    if (html.includes('reCAPTCHA') || html.includes('このページについて') || pageTitle.includes('search?')) {
      console.log(`  ⚠️  Google検索がブロックされました（reCAPTCHA）`)
      return null
    }
    
    // リンクを取得
    const links = await page.$$eval('a', (anchors: any[]) =>
      anchors.map((a) => a.href).filter((href: string) => href && href.length > 0)
    )
    
    console.log(`  📊 取得したリンク数: ${links.length}`)
    
    // グルナビのリンクを探す
    let foundCount = 0
    for (const link of links) {
      if (link.includes('gnavi.co.jp') || link.includes('r.gnavi.co.jp')) {
        foundCount++
        console.log(`  🔗 グルナビリンク[${foundCount}]: ${link.substring(0, 100)}...`)
        
        // Google検索結果の/url?q=...形式からURLを抽出
        let gurunaviUrl = link
        if (link.includes('/url?')) {
          try {
            const url = new URL(link)
            gurunaviUrl = url.searchParams.get('q') || link
          } catch {
            continue
          }
        }
        
        // グルナビの店舗URLパターンにマッチするか確認
        // パターン1: https://r.gnavi.co.jp/[店舗ID]/ (店舗IDは8文字以上の英数字)
        // パターン2: https://r.gnavi.co.jp/restaurant/[店舗ID]/
        // パターン3: https://www.gnavi.co.jp/restaurant/[店舗ID]/
        // /eki/, /area/ などのディレクトリは除外
        if (gurunaviUrl.includes('/eki/') || gurunaviUrl.includes('/area/') || 
            gurunaviUrl.includes('/sushi/') || gurunaviUrl.includes('/rs/')) {
          continue // 検索結果ページはスキップ
        }
        
        let match = gurunaviUrl.match(/(https?:\/\/r\.gnavi\.co\.jp\/[a-z0-9]{8,}\/?)/)
        if (match) {
          console.log(`  ✅ グルナビURL発見: ${match[1]}`)
          return match[1]
        }
        match = gurunaviUrl.match(/(https?:\/\/(?:r\.|www\.)?gnavi\.co\.jp\/restaurant\/[^\/]+\/?)/)
        if (match) {
          console.log(`  ✅ グルナビURL発見: ${match[1]}`)
          return match[1]
        }
      }
    }
    
    console.log(`  ⚠️  グルナビURLが見つかりませんでした（グルナビリンク数: ${foundCount}）`)
    return null
  } catch (error) {
    console.log(`  ⚠️  検索エラー: ${error}`)
    return null
  }
}

// グルナビからレビューを取得
async function scrapeGurunaviReviews(page: any, restaurantName: string, gurunaviUrl: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []

  try {
    // グルナビのレビューページにアクセス
    const reviewUrl = gurunaviUrl.replace(/\/$/, '') + '/review/'
    console.log(`  📖 グルナビレビューページにアクセス: ${reviewUrl}`)
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)
    
    // ページをスクロールしてコンテンツを読み込む（JavaScriptで動的に読み込まれる可能性があるため）
    await page.evaluate(() => {
      window.scrollBy(0, 500)
    })
    await page.waitForTimeout(2000)
    await page.evaluate(() => {
      window.scrollBy(0, 1000)
    })
    await page.waitForTimeout(2000)
    
    // ネットワークアイドルを待つ
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    } catch {
      // タイムアウトしても続行
    }

    const html = await page.content()
    const $ = cheerio.load(html)

    let reviewCount = 0
    
    // グルナビのレビュー要素のセレクター（複数のパターンを試す）
    // より広範囲のセレクターを試す（リストアイテム、記事、セクションなど）
    const reviewSelectors = [
      'li.review-item',
      'li[class*="review-item"]',
      'article.review-item',
      'article[class*="review"]',
      'div.review-item',
      'div[class*="review-item"]:not([class*="btn"]):not([class*="button"])',
      '.review-list li',
      '.review-list > div',
      'ul.review-list li',
      'ol.review-list li',
      '[class*="review-list"] li',
      '[class*="comment-item"]',
      '[class*="comment-list"] li',
      '.comment',
      '.review-comment'
    ]
    
    let foundReviews = false
    for (const selector of reviewSelectors) {
      const $items = $(selector)
      if ($items.length > 0) {
        foundReviews = true
        console.log(`  📊 レビュー要素発見: ${selector} (${$items.length}件)`)
        
        $items.each((idx: number, itemElement: any) => {
          const $item = $(itemElement)
          
          // レビューテキストを取得（複数のセレクターを試す）
          let reviewText = ''
          const textSelectors = [
            '.review-text',
            '.rvw-comment',
            '.review-content',
            '.review-comment',
            '.review-body',
            '[class*="review-text"]',
            '[class*="comment"]',
            'p'
          ]
          
          for (const textSelector of textSelectors) {
            const textElement = $item.find(textSelector).first()
            if (textElement.length > 0) {
              reviewText = textElement.text().trim()
              if (reviewText && reviewText.length >= 30) {
                break
              }
            }
          }
          
          // レビューテキストが見つからない場合は、item全体のテキストを使用
          if (!reviewText || reviewText.length < 20) {
            reviewText = $item.text().trim()
          }
          
          // 「もっと見る」「続きを読む」などのテキストを削除
          reviewText = reviewText.replace(/(もっと見る|続きを読む|全文を表示|…|\.\.\.)/g, '')
          reviewText = reviewText.replace(/\s+/g, ' ').trim()

          // 最小文字数を20文字に緩和（グルナビは短いコメントが多い可能性）
          if (!reviewText || reviewText.length < 20 || reviewText.length > 1000) return

          // 評価を取得
          let rating = 4
          const ratingSelectors = [
            '.rating',
            '.star-rating',
            '.review-rating',
            '[class*="rating"]',
            '[class*="star"]'
          ]
          
          for (const ratingSelector of ratingSelectors) {
            const ratingElement = $item.find(ratingSelector).first()
            if (ratingElement.length > 0) {
              const ratingText = ratingElement.text().trim()
              // 星の数を数える（★★★★★ → 5）
              const starMatch = ratingText.match(/★+/)
              if (starMatch) {
                rating = starMatch[0].length
                break
              }
              // 数値を取得（3.5 → 4）
              const ratingMatch = ratingText.match(/([0-9.]+)/)
              if (ratingMatch) {
                rating = Math.min(5, Math.max(1, Math.round(parseFloat(ratingMatch[1]))))
                break
              }
            }
          }

          // レビューの投稿日付を取得
          let originalDate: Date | undefined
          const dateSelectors = [
            '.review-date',
            '.date',
            '.review-time',
            '.post-date',
            '[class*="date"]',
            '[class*="time"]'
          ]
          
          for (const selector of dateSelectors) {
            const dateElement = $item.find(selector).first()
            if (dateElement.length > 0) {
              const dateText = dateElement.text().trim()
              const date = parseReviewDate(dateText)
              if (date) {
                originalDate = date
                break
              }
            }
          }
          
          // 元の日付からプラスマイナス2日ずらす
          let reviewDate: Date
          if (originalDate) {
            const offsets = [-2, -1, 1, 2]
            const daysOffset = offsets[Math.floor(Math.random() * offsets.length)]
            reviewDate = new Date(originalDate)
            reviewDate.setDate(reviewDate.getDate() + daysOffset)
          } else {
            const daysAgo = Math.floor(Math.random() * 365)
            reviewDate = new Date()
            reviewDate.setDate(reviewDate.getDate() - daysAgo)
          }

          if (isDateRelatedReview(reviewText)) {
            reviewCount++
            console.log(`  ✅ [${reviewCount}] デート関連レビュー | 評価: ${rating} | 日付: ${reviewDate.toLocaleDateString('ja-JP')}`)
            reviews.push({ restaurantName, rating, reviewText, reviewDate })
          }
        })
        
        break // 最初に見つかったセレクターで処理を終了
      }
    }
    
    if (!foundReviews) {
      console.log(`  ⚠️  レビュー要素が見つかりませんでした`)
    }

    console.log(`  📊 ${reviews.length}件のデート関連レビューを抽出`)
  } catch (error) {
    console.error(`  ❌ スクレイピングエラー:`, error)
  }

  return reviews
}

// 食べログからレビューを取得
async function scrapeTabelogReviews(page: any, restaurantName: string, tabelogUrl: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []

  try {
    const reviewUrl = tabelogUrl.replace(/\/$/, '').replace(/\/dtlrvwlst\/?$/, '') + '/dtlrvwlst/'
    console.log(`  📖 レビューページにアクセス: ${reviewUrl}`)
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    const html = await page.content()
    const $ = cheerio.load(html)

    let reviewCount = 0
    $('.rvw-item').each((idx: number, itemElement: any) => {
      const $item = $(itemElement)
      let reviewText = $item.find('.rvw-item__rvw-comment, .rvw-item__comment, .rvw-item__rvw-txt').text().trim()
      reviewText = reviewText.replace(/by\s+[^\s]+(?:\s*\(\d+\))?[^\s]*/gi, '')
      reviewText = reviewText.replace(/[^\s]+\(\d+\)/g, '')
      reviewText = reviewText.replace(/(もっと見る|続きを読む)/g, '')
      reviewText = reviewText.replace(/\s+/g, ' ').trim()

      // レビューはそのまま取り込む（リライト関数内で不自然な部分を削除）
      if (!reviewText || reviewText.length < 30 || reviewText.length > 1000) return

      let rating = 4
      const ratingSelectors = ['.rvw-item__ratings--val', '.c-rating-v3__val', '.c-rating__val']
      for (const selector of ratingSelectors) {
        const ratingElement = $item.find(selector).first()
        if (ratingElement.length > 0) {
          const ratingMatch = ratingElement.text().trim().match(/([0-9.]+)/)
          if (ratingMatch) {
            rating = Math.min(5, Math.max(1, Math.round(parseFloat(ratingMatch[1]))))
            break
          }
        }
      }

      // レビューの投稿日付を取得
      let originalDate: Date | undefined
      const dateSelectors = ['.rvw-item__visit-date', '.rvw-item__date', '.c-rating__time']
      for (const selector of dateSelectors) {
        const dateElement = $item.find(selector).first()
        if (dateElement.length > 0) {
          const dateText = dateElement.text().trim()
          // 日付のパース（「2024年12月28日」や「2024/12/28」などの形式に対応）
          const date = parseReviewDate(dateText)
          if (date) {
            originalDate = date
            break
          }
        }
      }
      
      // 元の日付からプラスマイナス2日ずらす（0日は除外して、-2, -1, +1, +2のいずれか）
      let reviewDate: Date
      if (originalDate) {
        const offsets = [-2, -1, 1, 2] // 0は除外
        const daysOffset = offsets[Math.floor(Math.random() * offsets.length)]
        reviewDate = new Date(originalDate)
        reviewDate.setDate(reviewDate.getDate() + daysOffset)
      } else {
        // 日付が取得できなかった場合は、ランダムに過去1年以内の日付を生成（自然なバリエーションのため）
        const daysAgo = Math.floor(Math.random() * 365) // 0-364日前
        reviewDate = new Date()
        reviewDate.setDate(reviewDate.getDate() - daysAgo)
      }

      if (isDateRelatedReview(reviewText)) {
        reviewCount++
        console.log(`  ✅ [${reviewCount}] デート関連レビュー | 評価: ${rating} | 日付: ${reviewDate.toLocaleDateString('ja-JP')}`)
        reviews.push({ restaurantName, rating, reviewText, reviewDate })
      }
    })

    console.log(`  📊 ${reviews.length}件のデート関連レビューを抽出`)
  } catch (error) {
    console.error(`  ❌ スクレイピングエラー:`, error)
  }

  return reviews
}

// レビューをデータベースに追加
async function addReviewToDatabase(review: ExternalReview, restaurantId: string, area: string, rewrittenText: string): Promise<boolean> {
  try {
    // リライト後のテキストで重複チェック
    const existingReview = await prisma.reviews.findFirst({
      where: {
        restaurant_id: restaurantId,
        review_text: rewrittenText,
      },
    })

    if (existingReview) {
      console.log(`  ⚠️  重複レビューをスキップ（DB内に既存）`)
      return false
    }

    // レビューの投稿日付を使用（取得できなかった場合は過去1年以内のランダムな日付）
    const createdAt = review.reviewDate || new Date()
    
    await prisma.reviews.create({
      data: {
        id: randomUUID(),
        restaurant_id: restaurantId,
        user_id: null,
        rating: review.rating,
        date_appropriateness: review.rating,
        review_text: rewrittenText,
        is_anonymous: true,
        created_at: createdAt,
        updated_at: createdAt,
      },
    })

    console.log(`  ✅ リライト後のレビューを追加: ${rewrittenText.substring(0, 50)}...`)
    return true
  } catch (error) {
    console.error(`  ❌ 追加エラー:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 全店舗でのレビュー取り込みを開始します（食べログ・グルナビ対応）\n')
  console.log('⏰ 開始時刻:', new Date().toLocaleString('ja-JP'))
  console.log('='.repeat(80))
  
  // 全店舗を取得
  const allRestaurants = await prisma.restaurants.findMany({
    where: { is_active: true },
    select: { id: true, name: true, area: true },
    orderBy: { name: 'asc' },
  })
  
  console.log(`📊 対象店舗数: ${allRestaurants.length}件\n`)

  // ボット判定回避のための設定
  const browser = await chromium.launch({ 
    headless: true, // バックグラウンド実行
    args: [
      '--disable-blink-features=AutomationControlled', // 自動化検出を無効化
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  })
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  })
  
  const page = await context.newPage()
  
  // WebDriverプロパティを削除（ボット検知回避）
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  let totalReviews = 0
  let totalSkipped = 0
  let processedCount = 0
  let errorCount = 0

  try {
    for (let i = 0; i < allRestaurants.length; i++) {
      const restaurant = allRestaurants[i]
      processedCount++
      
      console.log(`\n[${processedCount}/${allRestaurants.length}] ${restaurant.name} (${restaurant.area})`)
      console.log('-'.repeat(80))

      try {
        console.log(`  ✅ 店舗ID: ${restaurant.id}`)

        const allReviews: ExternalReview[] = []
        const addedTexts = new Set<string>()

        // 食べログからレビューを取得
        const tabelogUrl = await searchTabelogUrl(page, restaurant.name, restaurant.area)
        if (tabelogUrl) {
          const tabelogReviews = await scrapeTabelogReviews(page, restaurant.name, tabelogUrl)
          allReviews.push(...tabelogReviews)
        } else {
          console.log(`  → 食べログURLが見つかりませんでした`)
        }

        // グルナビからレビューを取得
        const gurunaviUrl = await searchGurunaviUrl(page, restaurant.name, restaurant.area)
        if (gurunaviUrl) {
          const gurunaviReviews = await scrapeGurunaviReviews(page, restaurant.name, gurunaviUrl)
          allReviews.push(...gurunaviReviews)
        } else {
          console.log(`  → グルナビURLが見つかりませんでした`)
        }

        if (allReviews.length === 0) {
          console.log(`  ⚠️  デート関連レビューなし`)
          continue
        }

        // レビューをデータベースに追加（最大5件、重複排除）
        for (const review of allReviews.slice(0, 20)) { // 多めに取得して重複を避ける
          if (addedTexts.size >= 5) break // 5件追加したら終了
          
          const rewrittenText = naturalRewrite(review.reviewText, review.restaurantName, restaurant.area)
          
          // 既に追加済みのテキストと重複していないかチェック
          if (addedTexts.has(rewrittenText)) {
            console.log(`  ⚠️  重複するリライト結果をスキップ`)
            totalSkipped++
            continue
          }
          
          const added = await addReviewToDatabase(review, restaurant.id, restaurant.area, rewrittenText)
          if (added) {
            totalReviews++
            addedTexts.add(rewrittenText)
          } else {
            totalSkipped++
          }
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        errorCount++
        console.error(`  ❌ エラーが発生しました: ${error}`)
        // エラーが発生しても次の店舗に続行（1店舗でエラーが発生しても全体は続行）
        continue
      }
      
      // 店舗間に待機時間を設ける（サーバー負荷軽減）
      if (i < allRestaurants.length - 1) {
        const waitTime = 3000 + Math.random() * 2000 // 3-5秒
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ 全店舗の処理が完了しました')
    console.log('='.repeat(80))
    console.log(`⏰ 終了時刻: ${new Date().toLocaleString('ja-JP')}`)
    console.log(`📊 処理した店舗数: ${processedCount}件`)
    console.log(`📊 追加したレビュー数: ${totalReviews}件`)
    console.log(`📊 スキップしたレビュー数: ${totalSkipped}件`)
    console.log(`📊 エラーが発生した店舗数: ${errorCount}件`)

  } catch (error) {
    console.error('\n❌ 重大なエラーが発生しました:', error)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
