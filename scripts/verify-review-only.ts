import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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

async function main() {
  console.log('🔍 追加したレビューを検証します...\n')

  try {
    // 最後に追加されたレビューを取得
    const review = await prisma.reviews.findFirst({
      where: {
        user_id: null, // 外部レビュー
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        restaurants: true,
      },
    })

    if (!review) {
      console.log('❌ 外部レビューが見つかりませんでした')
      return
    }

    console.log('=' .repeat(80))
    console.log('📊 追加されたレビュー情報')
    console.log('=' .repeat(80))
    console.log('')
    console.log(`📍 店舗情報:`)
    console.log(`  ID: ${review.restaurants.id}`)
    console.log(`  名前: ${review.restaurants.name}`)
    console.log(`  エリア: ${review.restaurants.area}`)
    console.log(`  住所: ${review.restaurants.address}`)
    console.log('')
    console.log(`⭐ レビュー情報:`)
    console.log(`  ID: ${review.id}`)
    console.log(`  評価: ${'⭐'.repeat(review.rating)} (${review.rating}/5)`)
    console.log(`  デート適性: ${review.date_appropriateness}/5`)
    console.log(`  匿名: ${review.is_anonymous ? 'はい' : 'いいえ'}`)
    console.log(`  作成日時: ${review.created_at.toLocaleString('ja-JP')}`)
    console.log('')
    console.log(`📝 レビューテキスト:`)
    console.log(`  ${review.review_text}`)
    console.log('')

    // レビューテキストの分析
    console.log('=' .repeat(80))
    console.log('📏 レビューテキストの分析')
    console.log('=' .repeat(80))
    console.log('')
    
    const textLength = review.review_text.length
    console.log(`  文字数: ${textLength}文字`)
    
    // 途中で切れているかチェック
    const isTruncated = review.review_text.endsWith('...')
    if (isTruncated) {
      console.log(`  ⚠️  レビューが「...」で終わっています（途中で切れている可能性）`)
    } else {
      console.log(`  ✅ レビューは完全な文章のようです`)
    }
    
    // 文字数のチェック
    if (textLength < 100) {
      console.log(`  ⚠️  レビューが短い可能性があります（100文字未満）`)
    } else if (textLength > 500) {
      console.log(`  ⚠️  レビューが長い可能性があります（500文字以上）`)
    } else {
      console.log(`  ✅ レビューの長さは適切です（100-500文字）`)
    }
    console.log('')

    // 店舗とレビューの整合性チェック
    console.log('=' .repeat(80))
    console.log('🔍 店舗とレビューの整合性チェック')
    console.log('=' .repeat(80))
    console.log('')
    
    const restaurantKeywords = review.restaurants.name.split(/[\s・]/)[0]
    const reviewMentionsRestaurant = review.review_text.includes(restaurantKeywords) ||
                                     review.review_text.includes(review.restaurants.name)
    
    console.log(`  店舗キーワード: ${restaurantKeywords}`)
    if (reviewMentionsRestaurant) {
      console.log(`  ✅ レビュー内に店舗名が含まれています`)
    } else {
      console.log(`  ⚠️  レビュー内に店舗名が含まれていません`)
      console.log(`     ※ 店舗名を明示せずにデート体験を書いているレビューの可能性があります`)
    }
    console.log('')

    // デート関連キーワードのチェック
    console.log('=' .repeat(80))
    console.log('💑 デート関連キーワードのチェック')
    console.log('=' .repeat(80))
    console.log('')
    
    const dateKeywords = [
      { keyword: 'デート', found: false },
      { keyword: 'カップル', found: false },
      { keyword: '記念日', found: false },
      { keyword: '誕生日', found: false },
      { keyword: '雰囲気', found: false },
      { keyword: 'ロマンチック', found: false },
      { keyword: '二人', found: false },
      { keyword: '恋人', found: false },
      { keyword: '彼女', found: false },
      { keyword: '彼氏', found: false },
      { keyword: '夜景', found: false },
      { keyword: '個室', found: false },
      { keyword: 'プロポーズ', found: false },
      { keyword: '特別な日', found: false },
    ]

    let foundKeywords: string[] = []
    for (const item of dateKeywords) {
      if (review.review_text.includes(item.keyword)) {
        item.found = true
        foundKeywords.push(item.keyword)
      }
    }

    console.log(`  見つかったキーワード: ${foundKeywords.length}個`)
    if (foundKeywords.length > 0) {
      console.log(`  ✅ ${foundKeywords.join('、')}`)
    } else {
      console.log(`  ⚠️  デート関連キーワードが見つかりませんでした`)
    }
    console.log('')

    // 総合評価
    console.log('=' .repeat(80))
    console.log('📊 総合評価')
    console.log('=' .repeat(80))
    console.log('')

    let score = 0
    let maxScore = 4

    // レビューの長さ
    if (textLength >= 100 && textLength <= 500) {
      console.log(`  ✅ レビューの長さが適切`)
      score++
    } else {
      console.log(`  ⚠️  レビューの長さを調整する必要があるかもしれません`)
    }

    // 完全性
    if (!isTruncated) {
      console.log(`  ✅ レビューは完全な文章`)
      score++
    } else {
      console.log(`  ⚠️  レビューが途中で切れています → リライトが推奨されます`)
    }

    // デート関連キーワード
    if (foundKeywords.length > 0) {
      console.log(`  ✅ デート関連キーワードが含まれています`)
      score++
    } else {
      console.log(`  ⚠️  デート関連キーワードが不足しています`)
    }

    // 店舗との整合性
    if (reviewMentionsRestaurant || foundKeywords.length > 0) {
      console.log(`  ✅ 店舗との整合性が確認できました`)
      score++
    } else {
      console.log(`  ⚠️  店舗との整合性を確認できませんでした`)
    }

    console.log('')
    console.log(`  総合スコア: ${score}/${maxScore}`)
    console.log('')

    if (score === maxScore) {
      console.log('  🎉 このレビューは非常に良い状態です！')
    } else if (score >= maxScore * 0.75) {
      console.log('  ✅ このレビューは良い状態です')
    } else if (score >= maxScore * 0.5) {
      console.log('  ⚠️  このレビューは改善の余地があります')
      console.log('  💡 OpenAI APIでリライトすることを推奨します')
    } else {
      console.log('  ❌ このレビューは大幅な改善が必要です')
      console.log('  💡 OpenAI APIでリライトすることを強く推奨します')
    }
    console.log('')

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
