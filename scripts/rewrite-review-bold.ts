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
  console.log('🔥 大胆なリライト方針でレビューを書き直します...\n')

  try {
    // 銀座店のレビューを取得
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
      console.log('❌ レビューが見つかりませんでした')
      return
    }

    console.log('📊 対象レビュー:')
    console.log(`  レビューID: ${review.id}`)
    console.log(`  店舗名: ${review.restaurants.name}`)
    console.log(`  エリア: ${review.restaurants.area}`)
    console.log('')

    console.log('📝 現在のレビュー (173文字):')
    console.log(`  ${review.review_text}`)
    console.log('')

    // 大胆にリライト
    const boldRewrittenText = '銀座でのランチデートに最適なお寿司屋さん。14時過ぎという時間帯が功を奏し、落ち着いた店内でゆったりと二人の時間を楽しめました。特上握り盛りは、まぐろ、いくら、うになど豪華なネタが並び、一品一品丁寧に握られた職人技が光ります。高級感がありながらも気取らない雰囲気で、記念日の食事にもぴったり。銀座で本格寿司を楽しみたいカップルにおすすめです。'

    console.log(`🔥 大胆なリライト後 (${boldRewrittenText.length}文字):`)
    console.log(`  ${boldRewrittenText}`)
    console.log('')

    console.log('=' .repeat(80))
    console.log('📊 リライトの比較')
    console.log('=' .repeat(80))
    console.log('')
    console.log('✨ 改善ポイント:')
    console.log('  1. デートシーンをより具体的に：「二人の時間を楽しめました」')
    console.log('  2. 雰囲気をより魅力的に：「落ち着いた店内」「高級感がありながらも気取らない」')
    console.log('  3. デート適性を明確に：「記念日の食事にもぴったり」')
    console.log('  4. ターゲットを明示：「カップルにおすすめ」')
    console.log('  5. 元の文章に縛られず全体を書き直し')
    console.log('')

    // データベースを更新
    console.log('💾 データベースを更新中...')
    await prisma.reviews.update({
      where: {
        id: review.id,
      },
      data: {
        review_text: boldRewrittenText,
        updated_at: new Date(),
      },
    })

    console.log('✅ レビューを更新しました！')
    console.log('')

    console.log('=' .repeat(80))
    console.log('✅ 大胆なリライト完了！')
    console.log('=' .repeat(80))
    console.log('')
    console.log('📊 最終的なレビュー:')
    console.log(`  店舗名: ${review.restaurants.name}`)
    console.log(`  エリア: ${review.restaurants.area}`)
    console.log(`  評価: ${'⭐'.repeat(review.rating)} (${review.rating}/5)`)
    console.log(`  デート適性: ${review.date_appropriateness}/5`)
    console.log('')
    console.log(`📝 レビュー:`)
    console.log(`  ${boldRewrittenText}`)

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
