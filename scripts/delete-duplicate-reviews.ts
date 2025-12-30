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

async function deleteDuplicateReviews() {
  console.log('🗑️  重複レビューを削除します...\n')
  
  const restaurantIds = [
    '00394e7f-6b82-4c66-9c34-c40bf06a4b56', // 鮨屋のうおきん 銀座店
    'bd06b85f-36ea-4cba-bd8c-09e124fa412b', // 鮨屋のうおきん 恵比寿店
    'd4fba03b-8eba-4d08-9abf-3a4ec8275d84', // 8TH SEA OYSTER Bar 銀座コリドー店
  ]
  
  for (const restaurantId of restaurantIds) {
    const restaurant = await prisma.restaurants.findUnique({
      where: { id: restaurantId },
      select: { name: true }
    })
    
    if (!restaurant) continue
    
    console.log(`📍 ${restaurant.name}`)
    
    // このレストランの全レビューを取得
    const reviews = await prisma.reviews.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { created_at: 'asc' }
    })
    
    console.log(`  現在のレビュー数: ${reviews.length}件`)
    
    // 重複チェック用のMap
    const seenTexts = new Map<string, string>()
    const duplicateIds: string[] = []
    
    for (const review of reviews) {
      if (seenTexts.has(review.review_text)) {
        duplicateIds.push(review.id)
        console.log(`  ⚠️  重複発見: ${review.review_text.substring(0, 40)}...`)
      } else {
        seenTexts.set(review.review_text, review.id)
      }
    }
    
    if (duplicateIds.length > 0) {
      const deleted = await prisma.reviews.deleteMany({
        where: { id: { in: duplicateIds } }
      })
      console.log(`  ✅ ${deleted.count}件の重複レビューを削除しました`)
    } else {
      console.log(`  ✅ 重複なし`)
    }
  }
  
  await prisma.$disconnect()
  console.log('\n✅ 完了')
}

deleteDuplicateReviews().catch(console.error)
