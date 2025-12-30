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
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// デート関連のキーワード
const DATE_KEYWORDS = [
  'デート',
  'カップル',
  '記念日',
  '誕生日',
  '雰囲気',
  'ロマンチック',
  '二人',
  '恋人',
  '彼女',
  '彼氏',
  '夜景',
  '個室',
  'プロポーズ',
  '特別な日',
]

interface ExternalReview {
  restaurantName: string
  rating: number
  reviewText: string
  source: 'tabelog'
}

// デート関連のレビューかどうかを判定
function isDateRelatedReview(reviewText: string): boolean {
  return DATE_KEYWORDS.some((keyword) => reviewText.includes(keyword))
}

// 大胆なリライト（AIを使わずに直接リライト）
function boldRewrite(originalText: string, restaurantName: string, restaurantArea: string): string {
  // 元のレビューからキーワードを抽出
  const hasLunch = originalText.includes('ランチ') || originalText.includes('お昼')
  const hasDinner = originalText.includes('ディナー') || originalText.includes('夜')
  const hasAnniversary = originalText.includes('記念日') || originalText.includes('誕生日')
  const hasAtmosphere = originalText.includes('雰囲気') || originalText.includes('落ち着')
  const hasPrivateRoom = originalText.includes('個室')
  const hasNightView = originalText.includes('夜景')
  
  // デートシーンの設定
  let dateScene = ''
  if (hasAnniversary) {
    dateScene = '記念日のディナー'
  } else if (hasDinner) {
    dateScene = 'ディナーデート'
  } else if (hasLunch) {
    dateScene = 'ランチデート'
  } else {
    dateScene = 'デート'
  }

  // 雰囲気の設定
  let atmosphere = ''
  if (hasPrivateRoom) {
    atmosphere = '個室でプライベートな時間を楽しめる'
  } else if (hasAtmosphere) {
    atmosphere = '落ち着いた雰囲気でゆったりと過ごせる'
  } else if (hasNightView) {
    atmosphere = '夜景が美しく、ロマンチックな雰囲気'
  } else {
    atmosphere = '二人だけの時間を大切にできる'
  }

  // リライトテンプレート
  const templates = [
    `${restaurantArea}での${dateScene}に最適なお店。${atmosphere}空間で、特別な時間を過ごせました。料理は一品一品丁寧に作られており、見た目も味も申し分なし。高級感がありながらも気取らない雰囲気で、記念日の食事にもぴったり。${restaurantArea}で素敵な${dateScene}を楽しみたいカップルにおすすめです。`,
    
    `彼女との${dateScene}で訪問。${atmosphere}店内で、会話も弾みリラックスした時間を過ごせました。料理のクオリティが高く、特別な日にふさわしい内容。スタッフの対応も丁寧で、デートの雰囲気を壊すことなく心地よいサービス。${restaurantArea}エリアでのデートに自信を持っておすすめできるお店です。`,
    
    `${restaurantArea}の隠れ家的な名店。${atmosphere}雰囲気が、デートの特別感をさらに高めてくれます。料理は季節感を大切にした繊細な仕上がりで、二人で一つ一つの味を楽しむことができました。記念日や特別な日のディナーに最適。カップルでゆっくり食事を楽しみたい方におすすめです。`,
  ]

  // ランダムにテンプレートを選択
  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)]
  
  return selectedTemplate
}

// 食べログからレビューを取得
async function scrapeTabelogReviews(restaurantName: string, restaurantArea: string, tabelogUrl: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []
  const browser = await chromium.launch({
    headless: true, // 本番はheadless
  })
  const page = await browser.newPage()

  try {
    // レビューページのURLを構築
    const reviewUrl = tabelogUrl.replace(/\/$/, '').replace(/\/dtlrvwlst\/?$/, '') + '/dtlrvwlst/'
    console.log(`  📖 レビューページに移動: ${reviewUrl}`)
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    const html = await page.content()
    const $ = cheerio.load(html)

    // 食べログのレビューセクションを取得
    let reviewCount = 0
    $('.rvw-item').each((idx, itemElement) => {
      const $item = $(itemElement)

      // レビューテキストを取得
      const reviewTextElement = $item.find('.rvw-item__rvw-comment, .rvw-item__comment, .rvw-item__rvw-txt')
      let reviewText = reviewTextElement.text().trim()

      // レビュアー情報や余分なテキストを除去
      reviewText = reviewText.replace(/by\s+[^\s]+(?:\s*\(\d+\))?[^\s]*/gi, '')
      reviewText = reviewText.replace(/[^\s]+\(\d+\)/g, '')
      reviewText = reviewText.replace(/(もっと見る|続きを読む)/g, '')
      reviewText = reviewText.replace(/\s+/g, ' ').trim()

      // レビューテキストの品質チェック
      if (!reviewText || reviewText.length < 30 || reviewText.length > 1000) return

      // 評価を取得
      let rating = 4 // デフォルト値

      const ratingSelectors = [
        '.rvw-item__ratings--val',
        '.c-rating-v3__val',
        '.rvw-item__ratings .c-rating-v3__val',
        '.rvw-item__ratings .c-rating__val',
        '.c-rating__val',
        '[class*="rating"] [class*="val"]',
      ]

      for (const selector of ratingSelectors) {
        const ratingElement = $item.find(selector).first()
        if (ratingElement.length > 0) {
          const ratingText = ratingElement.text().trim()
          const ratingMatch = ratingText.match(/([0-9.]+)/)
          if (ratingMatch) {
            const ratingValue = parseFloat(ratingMatch[1])
            rating = Math.round(ratingValue)
            if (rating > 5) rating = 5
            if (rating < 1) rating = 1
            break
          }
        }
      }

      // デート関連のレビューのみを追加
      if (isDateRelatedReview(reviewText)) {
        reviewCount++
        console.log(`  ✅ [${reviewCount}] デート関連レビュー発見 | 評価: ${rating} | ${reviewText.substring(0, 50)}...`)
        
        reviews.push({
          restaurantName: restaurantName,
          rating: rating,
          reviewText: reviewText,
          source: 'tabelog',
        })
      }
    })

    console.log(`  ✅ 食べログから ${reviews.length} 件のデート関連レビューを抽出しました`)

  } catch (error) {
    console.error(`  ❌ スクレイピングエラー:`, error)
  } finally {
    await browser.close()
  }

  return reviews
}

// レビューをデータベースに追加
async function addReviewToDatabase(review: ExternalReview, restaurantId: string, restaurantArea: string): Promise<boolean> {
  try {
    // 重複チェック
    const normalizedText = review.reviewText.replace(/\s+/g, '').toLowerCase()
    const existingReview = await prisma.reviews.findFirst({
      where: {
        restaurant_id: restaurantId,
        review_text: {
          contains: review.reviewText.substring(0, 50),
        },
      },
    })

    if (existingReview) {
      const existingNormalized = existingReview.review_text.replace(/\s+/g, '').toLowerCase()
      if (existingNormalized === normalizedText) {
        console.log(`  ⚠️  重複レビューをスキップ`)
        return false
      }
    }

    // 大胆にリライト
    const rewrittenText = boldRewrite(review.reviewText, review.restaurantName, restaurantArea)

    // レビューを追加
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

    console.log(`  ✅ リライト後のレビューを追加: ${rewrittenText.substring(0, 60)}...`)
    return true
  } catch (error) {
    console.error(`  ❌ レビュー追加エラー:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 複数店舗からデート関連レビューを取得します...\n')

  try {
    // テスト用の店舗リスト（食べログURLを直接指定）
    const testRestaurants = [
      {
        name: '鮨屋のうおきん 銀座店',
        area: '銀座',
        tabelogUrl: 'https://tabelog.com/tokyo/A1301/A130101/13251084/',
      },
      {
        name: 'レストラン・モナリザ 恵比寿本店',
        area: '恵比寿',
        tabelogUrl: 'https://tabelog.com/tokyo/A1303/A130302/13003726/',
      },
      {
        name: 'タイ国専門食堂 渋谷店',
        area: '渋谷',
        tabelogUrl: 'https://tabelog.com/tokyo/A1303/A130301/13119445/',
      },
    ]

    console.log(`📊 処理対象店舗数: ${testRestaurants.length}件\n`)

    let totalReviews = 0
    let totalSkipped = 0

    for (let i = 0; i < testRestaurants.length; i++) {
      const testRestaurant = testRestaurants[i]
      console.log(`\n[${i + 1}/${testRestaurants.length}] ${testRestaurant.name} (${testRestaurant.area})`)
      console.log('=' .repeat(80))

      // データベースから店舗を検索
      const restaurant = await prisma.restaurants.findFirst({
        where: {
          name: testRestaurant.name,
        },
        select: {
          id: true,
          name: true,
          area: true,
        },
      })

      if (!restaurant) {
        console.log(`  ⚠️  データベースに店舗が見つかりませんでした`)
        console.log(`  → スキップします`)
        continue
      }

      console.log(`  ✅ 店舗発見: ${restaurant.name}`)

      // レビューをスクレイピング
      const tabelogReviews = await scrapeTabelogReviews(testRestaurant.name, testRestaurant.area, testRestaurant.tabelogUrl)

      if (tabelogReviews.length === 0) {
        console.log(`  ⚠️  デート関連レビューが見つかりませんでした`)
        continue
      }

      // レビューをデータベースに追加
      for (const review of tabelogReviews) {
        const added = await addReviewToDatabase(review, restaurant.id, testRestaurant.area)
        if (added) {
          totalReviews++
        } else {
          totalSkipped++
        }
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n' + '=' .repeat(80))
    console.log('✅ 処理完了')
    console.log('=' .repeat(80))
    console.log(`📊 処理した店舗数: ${testRestaurants.length}件`)
    console.log(`📊 追加したレビュー数: ${totalReviews}件`)
    console.log(`📊 スキップしたレビュー数: ${totalSkipped}件`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
