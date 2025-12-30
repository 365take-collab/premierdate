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
  console.log('🔍 店舗マッチングの確認...\n')

  try {
    // テスト用の店舗名
    const testRestaurantName = '鮨屋のうおきん 銀座店'
    const tabelogUrl = 'https://tabelog.com/tokyo/A1301/A130101/13251084/'

    console.log('📊 テスト情報:')
    console.log(`  検索対象: ${testRestaurantName}`)
    console.log(`  食べログURL: ${tabelogUrl}`)
    console.log('')

    // データベースから「鮨屋のうおきん」を含む店舗をすべて検索
    const restaurants = await prisma.restaurants.findMany({
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
      orderBy: {
        name: 'asc',
      },
    })

    console.log(`🔍 データベース内の「鮨屋のうおきん」店舗数: ${restaurants.length}件`)
    console.log('')

    if (restaurants.length === 0) {
      console.log('❌ 「鮨屋のうおきん」が見つかりませんでした')
      return
    }

    console.log('📋 店舗一覧:')
    restaurants.forEach((restaurant, idx) => {
      console.log(`  [${idx + 1}] ${restaurant.name}`)
      console.log(`      エリア: ${restaurant.area}`)
      console.log(`      住所: ${restaurant.address}`)
      console.log(`      ID: ${restaurant.id}`)
      console.log('')
    })

    // 銀座店が存在するかチェック
    const ginzaStore = restaurants.find(r => r.name.includes('銀座'))
    const ebisuStore = restaurants.find(r => r.name.includes('恵比寿'))

    console.log('=' .repeat(80))
    console.log('🏪 店舗存在チェック')
    console.log('=' .repeat(80))
    console.log('')

    if (ginzaStore) {
      console.log('✅ 銀座店が存在します:')
      console.log(`   名前: ${ginzaStore.name}`)
      console.log(`   エリア: ${ginzaStore.area}`)
      console.log(`   住所: ${ginzaStore.address}`)
      console.log(`   ID: ${ginzaStore.id}`)
    } else {
      console.log('❌ 銀座店が見つかりませんでした')
    }
    console.log('')

    if (ebisuStore) {
      console.log('✅ 恵比寿店が存在します:')
      console.log(`   名前: ${ebisuStore.name}`)
      console.log(`   エリア: ${ebisuStore.area}`)
      console.log(`   住所: ${ebisuStore.address}`)
      console.log(`   ID: ${ebisuStore.id}`)
    } else {
      console.log('❌ 恵比寿店が見つかりませんでした')
    }
    console.log('')

    // 現在のマッチングロジックをシミュレート
    console.log('=' .repeat(80))
    console.log('🔬 現在のマッチングロジックのシミュレーション')
    console.log('=' .repeat(80))
    console.log('')
    console.log(`検索キーワード: ${testRestaurantName.split(' ')[0]}`)
    console.log('')

    const matchedRestaurant = await prisma.restaurants.findFirst({
      where: {
        name: {
          contains: testRestaurantName.split(' ')[0], // 最初の単語で検索
        },
      },
      select: {
        id: true,
        name: true,
        area: true,
      },
    })

    if (matchedRestaurant) {
      console.log('🎯 マッチした店舗:')
      console.log(`   ${matchedRestaurant.name}`)
      console.log(`   エリア: ${matchedRestaurant.area}`)
      console.log('')

      if (matchedRestaurant.name === testRestaurantName) {
        console.log('✅ 正しい店舗がマッチしました！')
      } else {
        console.log('❌ 間違った店舗がマッチしました！')
        console.log(`   期待: ${testRestaurantName}`)
        console.log(`   実際: ${matchedRestaurant.name}`)
      }
    }
    console.log('')

    // 問題の分析
    console.log('=' .repeat(80))
    console.log('⚠️  問題の分析')
    console.log('=' .repeat(80))
    console.log('')
    console.log('現在のマッチングロジックの問題点:')
    console.log('  1. 店舗名の最初の単語のみで検索している')
    console.log('     → 「鮨屋のうおきん」で検索すると、最初に見つかった店舗がマッチする')
    console.log('  2. 店舗名の完全一致や部分一致をチェックしていない')
    console.log('  3. エリア情報（銀座、恵比寿など）を考慮していない')
    console.log('')
    console.log('解決策:')
    console.log('  1. 店舗名の完全一致で検索する')
    console.log('  2. または、食べログURLから店舗を特定する仕組みを追加する')
    console.log('  3. エリア情報も考慮してマッチングする')

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
