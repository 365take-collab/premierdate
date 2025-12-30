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
  console.log('📊 データベース内の店舗一覧を取得します...\n')

  try {
    // 店舗数を取得
    const totalCount = await prisma.restaurants.count()
    console.log(`総店舗数: ${totalCount}件\n`)

    // エリア別に店舗を取得
    const areas = ['銀座', '恵比寿', '渋谷', '新宿', '六本木', '表参道', '青山']
    
    console.log('📋 エリア別の店舗一覧:\n')
    
    for (const area of areas) {
      const restaurants = await prisma.restaurants.findMany({
        where: {
          area: {
            contains: area,
          },
        },
        take: 5,
        select: {
          name: true,
          area: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      if (restaurants.length > 0) {
        console.log(`【${area}エリア】 ${restaurants.length}件以上`)
        restaurants.forEach((r, i) => {
          console.log(`  [${i + 1}] ${r.name}`)
        })
        console.log('')
      }
    }

    // ランダムに10店舗を取得
    console.log('📋 ランダム10店舗:\n')
    const randomRestaurants = await prisma.restaurants.findMany({
      take: 10,
      select: {
        name: true,
        area: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    randomRestaurants.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.name} (${r.area})`)
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
