import 'dotenv/config'
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

async function deleteAllReviews() {
  console.log('🗑️  全レビューを削除します...\n')
  
  // 削除前のレビュー数を確認
  const beforeCount = await prisma.reviews.count()
  console.log(`削除前のレビュー数: ${beforeCount}件\n`)
  
  if (beforeCount === 0) {
    console.log('レビューがありません。')
    await prisma.$disconnect()
    return
  }
  
  // 全削除
  const result = await prisma.reviews.deleteMany()
  console.log(`✅ ${result.count}件のレビューを削除しました\n`)
  
  // 削除後の確認
  const afterCount = await prisma.reviews.count()
  console.log(`削除後のレビュー数: ${afterCount}件`)
  
  await prisma.$disconnect()
}

deleteAllReviews().catch(console.error)
