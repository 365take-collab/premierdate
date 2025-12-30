import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { randomUUID } from 'crypto'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env file')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// デート関連のキーワード
const DATE_KEYWORDS = [
  'デート', 'カップル', '記念日', '誕生日', '雰囲気', 'ロマンチック',
  '二人', '恋人', '彼女', '彼氏', '夜景', '個室', 'プロポーズ', '特別な日',
]

interface ExternalReview {
  restaurantName: string
  rating: number
  reviewText: string
}

// デート関連のレビューかどうかを判定
function isDateRelatedReview(reviewText: string): boolean {
  return DATE_KEYWORDS.some((keyword) => reviewText.includes(keyword))
}

// 元のレビューをベースにデート向けにリライト
function boldRewrite(originalText: string, restaurantName: string, restaurantArea: string): string {
  // 元のレビューテキストを解析
  let rewritten = originalText
  
  // デート関連のキーワードが既にある場合はそのまま活かす
  const hasDateKeywords = /デート|カップル|記念日|誕生日|二人|恋人|彼女|彼氏/.test(originalText)
  
  // デート向けの表現に置き換え
  rewritten = rewritten.replace(/友人と|友達と|一人で|同僚と/g, 'デートで')
  rewritten = rewritten.replace(/訪れました|行きました|利用しました/g, '訪問しました')
  rewritten = rewritten.replace(/良かった|美味しかった|最高だった/g, '素敵でした')
  
  // 冒頭にデート向けの一言を追加（デートキーワードがない場合のみ）
  if (!hasDateKeywords) {
    const intros = [
      `${restaurantArea}でのデートにぴったりのお店です。`,
      `デートで訪れた${restaurantArea}のお店。`,
      `カップルにおすすめの${restaurantArea}のお店。`,
    ]
    const intro = intros[Math.floor(Math.random() * intros.length)]
    rewritten = intro + rewritten
  }
  
  // 末尾にデート向けの推薦文を追加
  const hasEnding = /おすすめ|ぴったり|最適/.test(rewritten)
  if (!hasEnding) {
    const endings = [
      'デートにおすすめのお店です。',
      '特別な日のディナーにぴったりです。',
      'カップルでゆっくり過ごしたい方におすすめです。',
    ]
    rewritten = rewritten + endings[Math.floor(Math.random() * endings.length)]
  }
  
  return rewritten
}

// 食べログの内部検索を使用
async function searchTabelogUrl(page: any, restaurantName: string, area: string): Promise<string | null> {
  try {
    console.log(`  🔍 食べログで「${restaurantName}」を検索中...`)
    
    // 食べログのトップページに行く
    await page.goto('https://tabelog.com/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)
    
    // 検索ボックスを見つけて入力
    const searchInput = page.locator('input[name="sk"]').first()
    await searchInput.fill(restaurantName)
    await page.waitForTimeout(500)
    
    // 検索ボタンをクリック
    const searchButton = page.locator('.c-btn--search, .js-search-btn, button[type="submit"]').first()
    await searchButton.click()
    await page.waitForTimeout(3000)
    
    // ページタイトル確認
    const pageTitle = await page.title()
    console.log(`  📄 ページタイトル: ${pageTitle}`)

    // 検索結果から店舗リンクを取得（複数のセレクターを試す）
    const selectors = [
      'a.list-rst__rst-name-target',
      '.list-rst__rst-name a',
      '.js-rst-name',
      '.list-rst a[href*="/A"]',
      'a[href*="tabelog.com/tokyo/A"]'
    ]
    
    let rawHrefs: Array<{href: string, name: string}> = []
    
    for (const selector of selectors) {
      try {
        rawHrefs = await page.$$eval(selector, (anchors: any[]) =>
          anchors.map((a) => ({
            href: a.getAttribute('href') ?? '',
            name: a.textContent?.trim() ?? ''
          })).filter((item: any) => item.href.includes('/A'))
        )
        if (rawHrefs.length > 0) {
          console.log(`  ✅ セレクター成功: ${selector}`)
          break
        }
      } catch {
        continue
      }
    }

    console.log(`  📊 検索結果: ${rawHrefs.length}件`)

    // 店名が一致するものを探す（最初の5件だけ表示）
    for (let i = 0; i < Math.min(rawHrefs.length, 5); i++) {
      const item = rawHrefs[i]
      console.log(`    → ${item.name}: ${item.href.substring(0, 60)}...`)
    }

    // 店名が完全一致または部分一致するリンクを探す
    for (const item of rawHrefs) {
      // 店名の類似度をチェック
      const normalizedItemName = item.name.replace(/[\s　]/g, '').toLowerCase()
      const normalizedSearchName = restaurantName.replace(/[\s　]/g, '').toLowerCase()
      
      if (normalizedItemName.includes(normalizedSearchName) || 
          normalizedSearchName.includes(normalizedItemName) ||
          normalizedItemName === normalizedSearchName) {
        const match = item.href.match(/(https?:\/\/tabelog\.com\/[a-z]+\/A\d+\/A\d+\/\d+\/?)/)
        if (match) {
          console.log(`  ✅ 一致する店舗を発見: ${item.name}`)
          console.log(`  ✅ 食べログURL: ${match[1]}`)
          return match[1]
        }
      }
    }

    console.log(`  ⚠️  一致する店舗が見つかりませんでした`)
    return null
  } catch (error) {
    console.log(`  ⚠️  検索エラー: ${error}`)
    return null
  }
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

      if (isDateRelatedReview(reviewText)) {
        reviewCount++
        console.log(`  ✅ [${reviewCount}] デート関連レビュー | 評価: ${rating}`)
        reviews.push({ restaurantName, rating, reviewText })
      }
    })

    console.log(`  📊 ${reviews.length}件のデート関連レビューを抽出`)
  } catch (error) {
    console.error(`  ❌ スクレイピングエラー:`, error)
  }

  return reviews
}

// レビューをデータベースに追加
async function addReviewToDatabase(review: ExternalReview, restaurantId: string, area: string): Promise<boolean> {
  try {
    const existingReview = await prisma.reviews.findFirst({
      where: {
        restaurant_id: restaurantId,
        review_text: { contains: review.reviewText.substring(0, 50) },
      },
    })

    if (existingReview) {
      console.log(`  ⚠️  重複レビューをスキップ`)
      return false
    }

    const rewrittenText = boldRewrite(review.reviewText, review.restaurantName, area)

    await prisma.reviews.create({
      data: {
        id: randomUUID(),
        restaurant_id: restaurantId,
        user_id: null,
        rating: review.rating,
        date_appropriateness: review.rating,
        review_text: rewrittenText,
        is_anonymous: true,
        updated_at: new Date(),
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
  console.log('🚀 3店舗でレビュー取得テストを実行します...\n')

  // テスト用の3店舗（データベースに存在する店舗名）
  // Google検索で「店名 食べログ」を検索して食べログURLを自動取得
  const testRestaurants = [
    { name: '鮨屋のうおきん 銀座店', area: '銀座' },
    { name: '鮨屋のうおきん 恵比寿店', area: '恵比寿' },
    { name: '8TH SEA OYSTER Bar 銀座コリドー店', area: '銀座' },
  ]

  // ボット判定回避のための設定
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
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

  try {
    for (let i = 0; i < testRestaurants.length; i++) {
      const testRestaurant = testRestaurants[i]
      console.log(`\n[${ i + 1}/${testRestaurants.length}] ${testRestaurant.name} (${testRestaurant.area})`)
      console.log('=' .repeat(80))

      // データベースから店舗を検索
      const restaurant = await prisma.restaurants.findFirst({
        where: { name: testRestaurant.name },
        select: { id: true, name: true, area: true },
      })

      if (!restaurant) {
        console.log(`  ⚠️  データベースに店舗が見つかりません → スキップ`)
        continue
      }

      console.log(`  ✅ 店舗ID: ${restaurant.id}`)

      // Google検索で食べログURLを取得
      const tabelogUrl = await searchTabelogUrl(page, testRestaurant.name, testRestaurant.area)
      if (!tabelogUrl) {
        console.log(`  → スキップします`)
        continue
      }

      // レビューをスクレイピング
      const reviews = await scrapeTabelogReviews(page, testRestaurant.name, tabelogUrl)

      if (reviews.length === 0) {
        console.log(`  ⚠️  デート関連レビューなし`)
        continue
      }

      // レビューをデータベースに追加（最大2件）
      for (const review of reviews.slice(0, 2)) {
        const added = await addReviewToDatabase(review, restaurant.id, testRestaurant.area)
        if (added) totalReviews++
        else totalSkipped++
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log('\n' + '=' .repeat(80))
    console.log('✅ テスト完了')
    console.log('=' .repeat(80))
    console.log(`📊 処理した店舗数: ${testRestaurants.length}件`)
    console.log(`📊 追加したレビュー数: ${totalReviews}件`)
    console.log(`📊 スキップしたレビュー数: ${totalSkipped}件`)

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
