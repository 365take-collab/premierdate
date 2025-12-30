import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
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

async function main() {
  console.log('🔧 レビューの店舗マッチング問題を修正します...\n')

  try {
    // 間違って追加されたレビューを取得
    const wrongReview = await prisma.reviews.findFirst({
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

    if (!wrongReview) {
      console.log('❌ レビューが見つかりませんでした')
      return
    }

    console.log('📊 間違って追加されたレビュー:')
    console.log(`  レビューID: ${wrongReview.id}`)
    console.log(`  店舗名: ${wrongReview.restaurants.name} ← ❌ 間違い（恵比寿店）`)
    console.log(`  エリア: ${wrongReview.restaurants.area}`)
    console.log('')

    // 正しい店舗（銀座店）を取得
    const correctRestaurant = await prisma.restaurants.findFirst({
      where: {
        name: '鮨屋のうおきん 銀座店', // 完全一致で検索
      },
    })

    if (!correctRestaurant) {
      console.log('❌ 銀座店が見つかりませんでした')
      return
    }

    console.log('✅ 正しい店舗（銀座店）:')
    console.log(`  店舗ID: ${correctRestaurant.id}`)
    console.log(`  店舗名: ${correctRestaurant.name}`)
    console.log(`  エリア: ${correctRestaurant.area}`)
    console.log('')

    // リライト後のレビューテキスト
    const reviewText = '彼女とのランチデートで訪問しました。14時という中途半端な時間でしたが、店内は空いていてすぐにテーブル席に案内され、ゆったりと過ごせました。特上握り盛りは、まぐろ、サーモン、エビ、いくら、うに、かんぱちなど新鮮なネタが揃い、見た目も華やか。銀座エリアで本格的なお寿司をリーズナブルに楽しめる穴場です。デートの食事としても十分満足できる内容でした。'

    console.log('=' .repeat(80))
    console.log('🔧 修正実行')
    console.log('=' .repeat(80))
    console.log('')

    // 手順1: 間違ったレビューを削除
    console.log('⚠️  手順1: 間違ったレビュー（恵比寿店）を削除中...')
    await prisma.reviews.delete({
      where: {
        id: wrongReview.id,
      },
    })
    console.log('✅ 削除完了')
    console.log('')

    // 手順2: 正しい店舗（銀座店）に新しいレビューを追加
    console.log('✅ 手順2: 正しい店舗（銀座店）にレビューを追加中...')
    const newReview = await prisma.reviews.create({
      data: {
        id: randomUUID(),
        restaurant_id: correctRestaurant.id,
        user_id: null, // 外部レビュー
        rating: 3,
        date_appropriateness: 3,
        review_text: reviewText,
        is_anonymous: true,
        updated_at: new Date(),
      },
    })
    console.log('✅ 追加完了')
    console.log(`   新しいレビューID: ${newReview.id}`)
    console.log('')

    // 結果を表示
    console.log('=' .repeat(80))
    console.log('✅ 修正完了！')
    console.log('=' .repeat(80))
    console.log('')
    console.log('📊 修正後のレビュー:')
    console.log(`  レビューID: ${newReview.id}`)
    console.log(`  店舗名: ${correctRestaurant.name} ← ✅ 正しい（銀座店）`)
    console.log(`  エリア: ${correctRestaurant.area}`)
    console.log(`  評価: ⭐⭐⭐ (3/5)`)
    console.log(`  デート適性: 3/5`)
    console.log('')
    console.log(`📝 レビュー:`)
    console.log(`  ${reviewText}`)
    console.log('')
    console.log('🎉 店舗マッチングの問題が修正されました！')

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
