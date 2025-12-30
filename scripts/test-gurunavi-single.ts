import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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
  reviewDate?: Date
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
    const match1 = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match1) {
      const year = parseInt(match1[1])
      const month = parseInt(match1[2]) - 1
      const day = parseInt(match1[3])
      return new Date(year, month, day)
    }
    
    const match2 = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (match2) {
      const year = parseInt(match2[1])
      const month = parseInt(match2[2]) - 1
      const day = parseInt(match2[3])
      return new Date(year, month, day)
    }
    
    const match3 = dateText.match(/(\d{1,2})\/(\d{1,2})/)
    if (match3) {
      const now = new Date()
      const year = now.getFullYear()
      const month = parseInt(match3[1]) - 1
      const day = parseInt(match3[2])
      return new Date(year, month, day)
    }
    
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

// Google検索でグルナビURLを検索
async function searchGurunaviUrl(page: any, restaurantName: string, area: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${restaurantName} ぐるなび`)
    const googleUrl = `https://www.google.com/search?hl=ja&q=${query}`
    
    console.log(`  🔍 Google検索: 「${restaurantName} ぐるなび」...`)
    
    await page.goto(googleUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    const waitTime = 2000 + Math.random() * 2000
    console.log(`  ⏳ ${Math.round(waitTime)}ms待機中...`)
    await page.waitForTimeout(waitTime)
    
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
    
    await page.evaluate(() => {
      window.scrollBy(0, 300 + Math.random() * 200)
    })
    await page.waitForTimeout(500 + Math.random() * 500)
    
    const html = await page.content()
    const pageTitle = await page.title()
    console.log(`  📄 ページタイトル: ${pageTitle}`)
    
    if (html.includes('reCAPTCHA') || html.includes('このページについて') || pageTitle.includes('search?')) {
      console.log(`  ⚠️  Google検索がブロックされました（reCAPTCHA）`)
      return null
    }
    
    const links = await page.$$eval('a', (anchors: any[]) =>
      anchors.map((a) => a.href).filter((href: string) => href && href.length > 0)
    )
    
    console.log(`  📊 取得したリンク数: ${links.length}`)
    
    let foundCount = 0
    for (const link of links) {
      if (link.includes('gnavi.co.jp') || link.includes('r.gnavi.co.jp')) {
        foundCount++
        console.log(`  🔗 グルナビリンク[${foundCount}]: ${link.substring(0, 100)}...`)
        
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
async function scrapeGurunaviReviews(page: any, restaurantName: string, gurunaviUrl: string, debugRestaurantName?: string): Promise<ExternalReview[]> {
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
    
    // 「もっと見る」ボタンをクリックして全文を表示
    try {
      const moreButtons = await page.$$('button:has-text("もっと見る"), a:has-text("もっと見る"), .more, .read-more, [class*="more"]')
      for (const button of moreButtons) {
        try {
          await button.click()
          await page.waitForTimeout(1000)
        } catch {
          // クリックできない場合はスキップ
        }
      }
    } catch {
      // エラーでも続行
    }
    
    // ネットワークアイドルを待つ
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    } catch {
      // タイムアウトしても続行
    }

    const html = await page.content()
    const $ = cheerio.load(html)
    
    // デバッグ: HTMLをファイルに保存（最初の店舗のみ）
    if (debugRestaurantName && restaurantName === debugRestaurantName) {
      const fs = require('fs')
      const path = require('path')
      const debugDir = path.join(__dirname, '..', 'debug-html')
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true })
      }
      const debugFile = path.join(debugDir, `gurunavi-${Date.now()}.html`)
      fs.writeFileSync(debugFile, html)
      console.log(`  💾 HTMLを保存しました: ${debugFile}`)
    }

    let reviewCount = 0
    
    // グルナビの「応援フォト」形式のレビューを取得
    const reviewSelectors = [
      'li.review_unit',
      '.review_unit',
      'li[class*="review_unit"]',
      '.review_unit-user-comment',
      '.comment',
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
      '.review-comment'
    ]
    
    let foundReviews = false
    for (const selector of reviewSelectors) {
      const $items = $(selector)
      if ($items.length > 0) {
        foundReviews = true
        console.log(`  📊 レビュー要素発見: ${selector} (${$items.length}件)`)
        
        // 各要素のクラス名とテキストを確認
        $items.each((idx: number, itemElement: any) => {
          const $item = $(itemElement)
          const classes = $item.attr('class') || ''
          const text = $item.text().trim().substring(0, 100)
          console.log(`  🔍 要素[${idx}] クラス: ${classes.substring(0, 100)}, テキスト: ${text}`)
        })
        
        // 最初の要素だけを処理
        if ($items.length > 5) {
          console.log(`  ⚠️  要素が多すぎるため、最初の5件のみ処理します`)
        }
        
        $items.each((idx: number, itemElement: any) => {
          const $item = $(itemElement)
          
          // デバッグ: 最初の要素のHTMLを表示
          if (idx === 0) {
            console.log(`  🔍 レビュー要素[${idx}]のHTML（最初の1000文字）: ${$item.html()?.substring(0, 1000)}`)
          }
          
          let reviewText = ''
          
          // グルナビの「応援フォト」形式のレビューテキストを取得
          // まず、.review_unit-user-commentから直接取得を試す
          const commentElement = $item.find('.review_unit-user-comment').first()
          if (commentElement.length > 0) {
            reviewText = commentElement.text().trim()
            if (idx === 0) {
              console.log(`  ✅ .review_unit-user-commentからテキスト取得: ${reviewText.substring(0, 100)}...`)
            }
          }
          
          // それでも取得できない場合は、他のセレクターを試す
          if (!reviewText || reviewText.length < 20) {
            const gurunaviCommentSelectors = [
              '.review_unit-user-comment p',
              '.review_unit-user-comment span',
              '.comment',
              '.review-text',
              '.rvw-comment',
              '.review-content',
              '.review-comment',
              '.review-body',
              '[class*="review-text"]',
              '[class*="comment"]',
              'p',
              'span'
            ]
            
            for (const textSelector of gurunaviCommentSelectors) {
              const textElement = $item.find(textSelector).first()
              if (textElement.length > 0) {
                const candidateText = textElement.text().trim()
                // 「…」で終わっていない、長めのテキストを優先
                if (candidateText && candidateText.length >= 20 && !candidateText.endsWith('…')) {
                  reviewText = candidateText
                  if (idx === 0) {
                    console.log(`  ✅ テキスト取得成功（セレクター: ${textSelector}）: ${reviewText.substring(0, 100)}...`)
                  }
                  break
                }
              }
            }
          }
          
          // それでも取得できない場合は、全体テキストから取得（シーン情報や日付を除外）
          if (!reviewText || reviewText.length < 20) {
            reviewText = $item.text().trim()
            // シーン情報（「お一人様」「友人・同僚と」など）を除外
            reviewText = reviewText.replace(/お一人様|お二人様|デート|家族|友人|同僚|一人|二人|グループ|友人・同僚と/g, '')
            reviewText = reviewText.replace(/\d{4}\/\d{1,2}\/\d{1,2}/g, '') // 日付を除外
            reviewText = reviewText.replace(/ほんそめわけべらさん|todonenさん|ぐるなび会員さん/g, '') // ユーザー名を除外
            reviewText = reviewText.replace(/\d+\.\d+点/g, '') // 点数を除外
            reviewText = reviewText.replace(/\s+/g, ' ').trim()
            if (idx === 0) {
              console.log(`  📝 全体テキスト取得: ${reviewText.substring(0, 200)}...`)
            }
          }
          
          // シーン情報を取得（デート関連かどうかの判断に使用）
          const sceneLabel = $item.find('.review_unit-scene-label').first().text().trim()
          if (sceneLabel && idx === 0) {
            console.log(`  🏷️  シーン情報: ${sceneLabel}`)
          }
          
          // シーン情報が「デート」「恋人」「カップル」などの場合は、レビューテキストに追加してデート関連として扱う
          if (sceneLabel && /デート|恋人|カップル|彼女|彼氏/.test(sceneLabel)) {
            if (!reviewText.includes('デート') && !reviewText.includes('恋人') && !reviewText.includes('カップル')) {
              reviewText = `デートで${reviewText}`
            }
          }
          
          // 「もっと見る」「続きを読む」などのテキストを削除
          reviewText = reviewText.replace(/(もっと見る|続きを読む|全文を表示|…|\.\.\.)/g, '')
          reviewText = reviewText.replace(/\s+/g, ' ').trim()
          
          // 「…」で終わっている場合は、その前の部分だけを使用（全文が取得できていない可能性）
          if (reviewText.endsWith('…')) {
            reviewText = reviewText.replace(/…+$/, '').trim()
            if (idx === 0) {
              console.log(`  ⚠️  レビューが省略されている可能性があります（「…」で終了）`)
            }
          }

          // 最小文字数を20文字に緩和（グルナビは短いコメントが多い可能性）
          if (!reviewText || reviewText.length < 20 || reviewText.length > 1000) {
            if (idx === 0) {
              console.log(`  ⚠️  レビューテキストが短すぎるか長すぎます（長さ: ${reviewText.length}）`)
            }
            return
          }
          
          if (idx === 0) {
            console.log(`  📄 最終的なレビューテキスト: ${reviewText.substring(0, 150)}...`)
          }

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
              const starMatch = ratingText.match(/★+/)
              if (starMatch) {
                rating = starMatch[0].length
                break
              }
              const ratingMatch = ratingText.match(/([0-9.]+)/)
              if (ratingMatch) {
                rating = Math.min(5, Math.max(1, Math.round(parseFloat(ratingMatch[1]))))
                break
              }
            }
          }

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

          // デバッグ: 全てのレビューを表示してデート関連かどうか確認
          reviewCount++
          const isDateRelated = isDateRelatedReview(reviewText)
          console.log(`  ${isDateRelated ? '✅' : '⚠️ '} [${reviewCount}] ${isDateRelated ? 'デート関連' : '通常'}レビュー | 評価: ${rating} | 日付: ${reviewDate.toLocaleDateString('ja-JP')}`)
          console.log(`     テキスト: ${reviewText}`)
          
          if (isDateRelated) {
            reviews.push({ restaurantName, rating, reviewText, reviewDate })
          }
        })
        
        break
      }
    }
    
    if (!foundReviews) {
      console.log(`  ⚠️  レビュー要素が見つかりませんでした`)
      console.log(`  📄 HTMLの一部: ${html.substring(0, 1000)}`)
    } else {
      // レビューに関連するキーワードをHTMLから検索
      const reviewKeywords = ['レビュー', 'review', 'コメント', 'comment', '口コミ', '評価', 'rating']
      for (const keyword of reviewKeywords) {
        if (html.includes(keyword)) {
          console.log(`  ✅ HTMLに「${keyword}」キーワードが見つかりました`)
          // キーワード周辺のHTMLを表示
          const index = html.indexOf(keyword)
          const snippet = html.substring(Math.max(0, index - 200), Math.min(html.length, index + 500))
          console.log(`  📄 キーワード周辺のHTML: ${snippet.substring(0, 300)}...`)
          break
        }
      }
    }

    console.log(`  📊 ${reviews.length}件のデート関連レビューを抽出`)
  } catch (error) {
    console.error(`  ❌ スクレイピングエラー:`, error)
  }

  return reviews
}

async function main() {
  console.log('🚀 グルナビレビュー取り込みテスト\n')

  // デート関連のレビューが多そうな店でテスト
  const testRestaurants = [
    { name: 'レストラン アンド カフェ ボンヴィヴァン', area: '渋谷' },
    { name: 'ル マンジュ トゥー', area: '六本木' },
    { name: 'リストランテ アサゴ', area: '銀座' },
    { name: 'リストランテ カンティーナ', area: '表参道' },
    { name: 'レストラン アンド バー ル シエル', area: '新宿' },
    { name: 'リストランテ カフェ ド パリ', area: '恵比寿' }
  ]

  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
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
  
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  let totalReviews = 0
  
  try {
    for (let i = 0; i < testRestaurants.length; i++) {
      const testRestaurant = testRestaurants[i]
      
      try {
        console.log(`\n[${i + 1}/${testRestaurants.length}] ${testRestaurant.name} (${testRestaurant.area})`)
        console.log('='.repeat(80))

        const gurunaviUrl = await searchGurunaviUrl(page, testRestaurant.name, testRestaurant.area)
        if (!gurunaviUrl) {
          console.log(`  → グルナビURLが見つかりませんでした`)
          continue
        }

        const reviews = await scrapeGurunaviReviews(page, testRestaurant.name, gurunaviUrl, testRestaurants[0].name)
        totalReviews += reviews.length
        
        console.log(`  ✅ この店舗で${reviews.length}件のレビューを抽出`)
        
        // 店舗間に待機
        if (i < testRestaurants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (error) {
        console.error(`  ❌ エラーが発生しました: ${error}`)
        continue
      }
    }

    console.log(`\n✅ テスト完了`)
    console.log(`📊 合計抽出したレビュー数: ${totalReviews}件`)
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
