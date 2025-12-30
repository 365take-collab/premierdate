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
    log: ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

async function main() {
  console.log('🔍 テスト用の店舗を検索します...\n')

  try {
    // 「鮨屋のうおきん」を検索
    console.log('【鮨屋のうおきん系列】')
    const uokinRestaurants = await prisma.restaurants.findMany({
      where: {
        name: {
          contains: '鮨屋のうおきん',
        },
      },
      select: {
        id: true,
        name: true,
        area: true,
        address: true,
      },
    })
    uokinRestaurants.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name} (${r.area})`)
      console.log(`      住所: ${r.address}`)
      console.log(`      ID: ${r.id}`)
    })
    console.log('')

    // 人気がありそうな店舗を検索（銀座エリアのイタリアン、フレンチなど）
    console.log('【銀座エリアの店舗（ランダム5件）】')
    const ginzaRestaurants = await prisma.restaurants.findMany({
      where: {
        area: '銀座',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        area: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    ginzaRestaurants.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name}`)
    })
    console.log('')

    // 恵比寿エリア
    console.log('【恵比寿エリアの店舗（ランダム5件）】')
    const ebisuRestaurants = await prisma.restaurants.findMany({
      where: {
        area: '恵比寿',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        area: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    ebisuRestaurants.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name}`)
    })
    console.log('')

    // 渋谷エリア
    console.log('【渋谷エリアの店舗（ランダム5件）】')
    const shibuyaRestaurants = await prisma.restaurants.findMany({
      where: {
        area: '渋谷',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        area: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    shibuyaRestaurants.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name}`)
    })

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
