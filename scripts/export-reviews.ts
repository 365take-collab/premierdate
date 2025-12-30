import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { writeFileSync } from 'fs'

// PrismaClientの初期化
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

const prisma = createPrismaClient()

async function exportReviews() {
  console.log('📤 レビューをエクスポート中...')

  const reviews = await prisma.reviews.findMany({
    where: {
      user_id: null, // 外部レビューのみ
    },
    include: {
      restaurants: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  console.log(`📊 エクスポートするレビュー数: ${reviews.length}件`)

  const exportData = reviews.map((review, index) => ({
    index: index + 1,
    id: review.id,
    restaurant_name: review.restaurants.name,
    original_text: review.review_text,
    rewritten_text: '', // ここに私がリライトしたテキストを入れます
  }))

  writeFileSync(
    'scripts/reviews-to-rewrite.json',
    JSON.stringify(exportData, null, 2),
    'utf-8'
  )

  console.log('✅ エクスポート完了: scripts/reviews-to-rewrite.json')
  console.log('\n次のステップ:')
  console.log('1. reviews-to-rewrite.jsonを確認')
  console.log('2. AIがrewritten_textフィールドをリライト')
  console.log('3. npm run import:rewritten-reviews でデータベースに反映')
}

exportReviews()
  .catch((e) => {
    console.error('❌ エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
