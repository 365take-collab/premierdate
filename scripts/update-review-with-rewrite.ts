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
  console.log('✍️  レビューをリライトしてデータベースを更新します...\n')

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

    console.log('📊 対象レビュー:')
    console.log(`  レビューID: ${review.id}`)
    console.log(`  店舗名: ${review.restaurants.name}`)
    console.log('')

    console.log('📝 元のレビューテキスト (95文字):')
    console.log(`  ${review.review_text}`)
    console.log('')

    // リライト後のテキスト
    const rewrittenText = '彼女とのランチデートで訪問しました。14時という中途半端な時間でしたが、店内は空いていてすぐにテーブル席に案内され、ゆったりと過ごせました。特上握り盛りは、まぐろ、サーモン、エビ、いくら、うに、かんぱちなど新鮮なネタが揃い、見た目も華やか。銀座エリアで本格的なお寿司をリーズナブルに楽しめる穴場です。デートの食事としても十分満足できる内容でした。'

    console.log(`✨ リライト後のレビューテキスト (${rewrittenText.length}文字):`)
    console.log(`  ${rewrittenText}`)
    console.log('')

    // データベースを更新
    console.log('💾 データベースを更新中...')
    const updatedReview = await prisma.reviews.update({
      where: {
        id: review.id,
      },
      data: {
        review_text: rewrittenText,
        updated_at: new Date(),
      },
    })

    console.log('✅ レビューを更新しました！')
    console.log('')

    // 更新後のレビューを表示
    console.log('=' .repeat(80))
    console.log('📊 更新後のレビュー')
    console.log('=' .repeat(80))
    console.log('')
    console.log(`📍 店舗名: ${review.restaurants.name}`)
    console.log(`📍 エリア: ${review.restaurants.area}`)
    console.log(`⭐ 評価: ${'⭐'.repeat(review.rating)} (${review.rating}/5)`)
    console.log(`💑 デート適性: ${review.date_appropriateness}/5`)
    console.log('')
    console.log(`📝 レビュー:`)
    console.log(`  ${rewrittenText}`)
    console.log('')
    console.log('=' .repeat(80))
    console.log('')
    console.log('🎉 データベースの更新が完了しました！')

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
