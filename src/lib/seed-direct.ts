// 直接実行用のシードスクリプト（環境変数を明示的に読み込む）
import { config } from 'dotenv'
import { resolve } from 'path'

// .envファイルを明示的に読み込む
config({ path: resolve(process.cwd(), '.env') })

import { PlanType, PriceRange } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('🌱 初期データのシードを開始します...')

  // 用途カテゴリの作成
  const purposes = await Promise.all([
    prisma.purpose_categories.upsert({
      where: { name: '初デート' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: '初デート',
        description: '初めてのデートにおすすめのお店',
        updated_at: new Date(),
      },
    }),
    prisma.purpose_categories.upsert({
      where: { name: '誕生日' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: '誕生日',
        description: '誕生日のデートにおすすめのお店',
        updated_at: new Date(),
      },
    }),
    prisma.purpose_categories.upsert({
      where: { name: '記念日' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: '記念日',
        description: '記念日のデートにおすすめのお店',
        updated_at: new Date(),
      },
    }),
    prisma.purpose_categories.upsert({
      where: { name: 'カジュアルデート' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: 'カジュアルデート',
        description: '気軽に楽しめるデートにおすすめのお店',
        updated_at: new Date(),
      },
    }),
    prisma.purpose_categories.upsert({
      where: { name: '夜のデート' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: '夜のデート',
        description: '夜のデートにおすすめのお店',
        updated_at: new Date(),
      },
    }),
  ])

  console.log('✅ 用途カテゴリを作成しました:', purposes.length, '件')

  // サンプル店舗データの作成（後で実際のデータに置き換え）
  const sampleRestaurants = [
    {
      name: 'レストラン サンプル1',
      area: '渋谷',
      address: '東京都渋谷区道玄坂1-2-3',
      price_range: PriceRange.BETWEEN_3000_5000,
      atmosphere: '落ち着いた雰囲気',
      customer_segment: '20代-30代',
      side_by_side_seats: true,
      hotel_distance_walk: 10,
      hotel_distance_train: 5,
      latitude: 35.658034,
      longitude: 139.701636,
      description: 'デートに最適な落ち着いたレストランです。',
      purpose_categoriesNames: ['初デート', 'カジュアルデート'],
    },
    {
      name: 'レストラン サンプル2',
      area: '新宿',
      address: '東京都新宿区新宿3-1-1',
      price_range: PriceRange.BETWEEN_5000_10000,
      atmosphere: '高級感のある雰囲気',
      customer_segment: '30代-40代',
      side_by_side_seats: true,
      hotel_distance_walk: 15,
      hotel_distance_train: 8,
      latitude: 35.690921,
      longitude: 139.700258,
      description: '記念日に最適な高級レストランです。',
      purpose_categoriesNames: ['誕生日', '記念日'],
    },
    {
      name: 'レストラン サンプル3',
      area: '表参道',
      address: '東京都渋谷区神宮前4-1-1',
      price_range: PriceRange.OVER_10000,
      atmosphere: '洗練された雰囲気',
      customer_segment: '20代-30代',
      side_by_side_seats: false,
      hotel_distance_walk: 20,
      hotel_distance_train: 10,
      latitude: 35.665412,
      longitude: 139.712677,
      description: 'おしゃれなデートに最適なレストランです。',
      purpose_categoriesNames: ['記念日', '夜のデート'],
    },
  ]

  for (const restaurantsData of sampleRestaurants) {
    const { purpose_categoriesNames, ...restaurantsInfo } = restaurantsData
    
    const restaurant = await prisma.restaurants.create({
      data: {
        id: crypto.randomUUID(),
        name: restaurantsInfo.name,
        area: restaurantsInfo.area,
        address: restaurantsInfo.address,
        price_range: restaurantsInfo.price_range,
        atmosphere: restaurantsInfo.atmosphere || null,
        customer_segment: restaurantsInfo.customer_segment || null,
        side_by_side_seats: restaurantsInfo.side_by_side_seats || false,
        hotel_distance_walk: restaurantsInfo.hotel_distance_walk || null,
        hotel_distance_train: restaurantsInfo.hotel_distance_train || null,
        latitude: restaurantsInfo.latitude,
        longitude: restaurantsInfo.longitude,
        description: restaurantsInfo.description || null,
        name_kana: null,
        address_detail: null,
        phone_number: null,
        image_url: null,
        website_url: null,
        reservation_url: null,
        updated_at: new Date(),
      },
    })

    // 用途カテゴリとの関連付け
    for (const purposeName of purpose_categoriesNames) {
      const purpose_category = purposes.find((p) => p.name === purposeName)
      if (purpose_category) {
        await prisma.restaurant_purposes.create({
          data: {
            id: crypto.randomUUID(),
            restaurant_id: restaurant.id,
            purpose_category_id: purpose_category.id,
            priority: 0,
          },
        }).catch(() => {
          // 既に存在する場合はスキップ
          console.log(`  店舗 ${restaurant.name} と用途 ${purposeName} の関連は既に存在します`)
        })
      }
    }
  }

  console.log('✅ サンプル店舗データを作成しました:', sampleRestaurants.length, '件')

  console.log('🎉 シードが完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ シード中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

