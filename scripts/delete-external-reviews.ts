import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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

async function deleteExternalReviews() {
  console.log('🗑️  外部レビュー（user_id = null）を削除中...')

  const result = await prisma.reviews.deleteMany({
    where: {
      user_id: null, // 外部レビューのみ
    },
  })

  console.log(`✅ 削除完了: ${result.count}件`)
}

deleteExternalReviews()
  .catch((e) => {
    console.error('❌ エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
