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
  source: 'tabelog' | 'tokyo-calendar' | 'gurunavi'
}

// デート関連のレビューかどうかを判定
function isDateRelatedReview(reviewText: string): boolean {
  return DATE_KEYWORDS.some((keyword) => reviewText.includes(keyword))
}

// 食べログからレビューを取得（簡易版）
async function scrapeTabelogReviews(restaurantName: string, tabelogUrl: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []
  const browser = await chromium.launch({
    headless: false, // デバッグ用にブラウザを表示
  })
  const page = await browser.newPage()

  try {
    // レビューページのURLを構築
    const reviewUrl = tabelogUrl.replace(/\/$/, '').replace(/\/dtlrvwlst\/?$/, '') + '/dtlrvwlst/'
    console.log(`  📖 レビューページに移動: ${reviewUrl}`)
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000) // レビューが読み込まれるまで待機

    const html = await page.content()
    const $ = cheerio.load(html)

    // 食べログのレビューセクションを取得
    console.log(`\n🔍 レビュー要素の検索:`)
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
      if (!reviewText || reviewText.length < 30 || reviewText.length > 1000) {
        console.log(`  ⚠️  スキップ（長さ不適切）: [${idx + 1}] ${reviewText.length}文字`)
        return
      }

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

      // デート関連のキーワードをチェック
      const isDateRelated = isDateRelatedReview(reviewText)
      const statusEmoji = isDateRelated ? '✅ デート関連' : '❌ 非デート関連'

      console.log(`  [${idx + 1}] ${statusEmoji} | 評価: ${rating} | ${reviewText.substring(0, 80)}...`)

      // デート関連のレビューのみを追加
      if (isDateRelated) {
        reviews.push({
          restaurantName: restaurantName,
          rating: rating,
          reviewText: reviewText,
          source: 'tabelog',
        })
      }
    })

    console.log(`\n✅ 食べログから ${reviews.length} 件のデート関連レビューを抽出しました。`)

  } catch (error) {
    console.error(`  ❌ 食べログのスクレイピングエラー (${restaurantName}):`, error)
  } finally {
    await browser.close()
  }

  return reviews
}

// レビューをデータベースに追加
async function addReviewToDatabase(review: ExternalReview, restaurantId: string): Promise<boolean> {
  try {
    // 正規化されたレビューテキスト（重複チェック用）
    const normalizedText = review.reviewText
      .replace(/\s+/g, '')
      .toLowerCase()

    // 重複チェック（同じ店舗で同じようなレビューがないか）
    const existingReview = await prisma.reviews.findFirst({
      where: {
        restaurant_id: restaurantId,
        review_text: {
          contains: review.reviewText.substring(0, 50), // 最初の50文字で部分一致チェック
        },
      },
    })

    if (existingReview) {
      // 正規化されたテキストで完全一致チェック
      const existingNormalized = existingReview.review_text
        .replace(/\s+/g, '')
        .toLowerCase()

      if (existingNormalized === normalizedText) {
        console.log(`  ⚠️  重複レビューをスキップ: ${review.reviewText.substring(0, 30)}...`)
        return false
      }
    }

    // レビューを追加
    const newReview = await prisma.reviews.create({
      data: {
        id: randomUUID(),
        restaurant_id: restaurantId,
        user_id: null, // 外部レビューはuser_idをnullに
        rating: review.rating,
        date_appropriateness: review.rating, // 評価と同じ値を使用（後で調整可能）
        review_text: review.reviewText,
        is_anonymous: true, // 外部レビューは匿名
        updated_at: new Date(),
      },
    })

    console.log(`  ✅ レビューをデータベースに追加しました (ID: ${newReview.id})`)
    return true
  } catch (error) {
    console.error(`  ❌ レビューの追加エラー:`, error)
    return false
  }
}

async function main() {
  console.log('🧪 単一店舗のレビュースクレイピングテスト...\n')

  try {
    // テスト用の店舗情報（直接指定）
    const testRestaurantName = '鮨屋のうおきん 銀座店'
    const testTabelogUrl = 'https://tabelog.com/tokyo/A1301/A130101/13251084/'

    console.log('📊 テスト対象店舗:')
    console.log(`  店舗名: ${testRestaurantName}`)
    console.log(`  食べログURL: ${testTabelogUrl}`)
    console.log('')

    // レビューをスクレイピング
    const reviews = await scrapeTabelogReviews(testRestaurantName, testTabelogUrl)

    // 結果を表示
    console.log('\n📊 取得結果:')
    console.log(`  デート関連レビュー数: ${reviews.length}件`)
    
    if (reviews.length > 0) {
      console.log('\n📝 取得したレビュー:')
      reviews.forEach((review, idx) => {
        console.log(`\n  [${idx + 1}] 評価: ${'⭐'.repeat(review.rating)}`)
        console.log(`  ${review.reviewText}`)
      })

      // データベースに追加するか確認
      console.log('\n💾 データベースに追加しますか？')
      console.log('  (このテストでは自動的に追加します)')

      // データベースから店舗を検索（店舗名で完全一致）
      const restaurant = await prisma.restaurants.findFirst({
        where: {
          name: testRestaurantName, // 完全一致で検索
        },
        select: {
          id: true,
          name: true,
        },
      })

      if (!restaurant) {
        console.log('\n⚠️  データベースに該当する店舗が見つかりませんでした')
        console.log('  レビューを追加するには、先に店舗をデータベースに追加してください')
        return
      }

      console.log(`\n✅ 店舗を発見: ${restaurant.name} (ID: ${restaurant.id})`)

      // レビューをデータベースに追加
      let addedCount = 0
      let skippedCount = 0

      for (const review of reviews) {
        const added = await addReviewToDatabase(review, restaurant.id)
        if (added) {
          addedCount++
        } else {
          skippedCount++
        }
      }

      console.log('\n📊 追加結果:')
      console.log(`  追加したレビュー数: ${addedCount}件`)
      console.log(`  スキップしたレビュー数: ${skippedCount}件`)
    } else {
      console.log('\n⚠️  デート関連レビューが見つかりませんでした')
    }

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
