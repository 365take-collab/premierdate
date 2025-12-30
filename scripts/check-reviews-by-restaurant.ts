import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// データベース接続
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({
  adapter,
  log: ['error'],
})

async function checkReviews() {
  console.log('📊 テストした3店舗のレビューを確認します...\n')
  
  const searchNames = [
    '鮨屋のうおきん',
    '8TH SEA OYSTER Bar'
  ]
  
  for (const searchName of searchNames) {
    const restaurants = await prisma.restaurants.findMany({
      where: { name: { contains: searchName } },
      take: 10
    })
    
    for (const restaurant of restaurants) {
      const reviews = await prisma.reviews.findMany({
        where: { restaurant_id: restaurant.id },
        orderBy: { created_at: 'desc' },
        take: 5
      })
      
      console.log(`\n📍 ${restaurant.name}`)
      console.log(`   ID: ${restaurant.id}`)
      console.log(`   レビュー数: ${reviews.length}件`)
      for (const r of reviews) {
        const content = r.review_text || '(内容なし)'
        console.log(`   [${r.rating}⭐] ${content.substring(0, 60)}...`)
      }
    }
  }
  
  await prisma.$disconnect()
}

checkReviews().catch(console.error)
