import 'dotenv/config'
import { PlanType, PriceRange } from '@prisma/client'
import { randomUUID } from 'crypto'
import { prisma } from './prisma'

async function main() {
  console.log('🌱 初期データのシードを開始します...')

  // 用途カテゴリの作成
  const purposes = await Promise.all([
      prisma.purpose_categories.upsert({
        where: { name: '初デート' },
        update: {},
        create: {
          id: randomUUID(),
          name: '初デート',
          description: '初めてのデートにおすすめのお店',
          updated_at: new Date(),
        },
      }),
      prisma.purpose_categories.upsert({
        where: { name: '誕生日' },
        update: {},
        create: {
          id: randomUUID(),
          name: '誕生日',
          description: '誕生日のデートにおすすめのお店',
          updated_at: new Date(),
        },
      }),
      prisma.purpose_categories.upsert({
        where: { name: '記念日' },
        update: {},
        create: {
          id: randomUUID(),
          name: '記念日',
          description: '記念日のデートにおすすめのお店',
          updated_at: new Date(),
        },
      }),
      prisma.purpose_categories.upsert({
        where: { name: 'カジュアルデート' },
        update: {},
        create: {
          id: randomUUID(),
          name: 'カジュアルデート',
          description: '気軽に楽しめるデートにおすすめのお店',
          updated_at: new Date(),
        },
      }),
      prisma.purpose_categories.upsert({
        where: { name: '夜のデート' },
        update: {},
        create: {
          id: randomUUID(),
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
      priceRange: PriceRange.BETWEEN_3000_5000,
      atmosphere: '落ち着いた雰囲気',
      customerSegment: '20代-30代',
      sideBySideSeats: true,
      hotelDistanceWalk: 10,
      hotelDistanceTrain: 5,
      latitude: 35.658034,
      longitude: 139.701636,
      description: 'デートに最適な落ち着いたレストランです。',
      purposeCategoryNames: ['初デート', 'カジュアルデート'],
    },
    {
      name: 'レストラン サンプル2',
      area: '新宿',
      address: '東京都新宿区新宿3-1-1',
      priceRange: PriceRange.BETWEEN_5000_10000,
      atmosphere: '高級感のある雰囲気',
      customerSegment: '30代-40代',
      sideBySideSeats: true,
      hotelDistanceWalk: 15,
      hotelDistanceTrain: 8,
      latitude: 35.690921,
      longitude: 139.700258,
      description: '記念日に最適な高級レストランです。',
      purposeCategoryNames: ['誕生日', '記念日'],
    },
    {
      name: 'レストラン サンプル3',
      area: '表参道',
      address: '東京都渋谷区神宮前4-1-1',
      priceRange: PriceRange.OVER_10000,
      atmosphere: '洗練された雰囲気',
      customerSegment: '20代-30代',
      sideBySideSeats: false,
      hotelDistanceWalk: 20,
      hotelDistanceTrain: 10,
      latitude: 35.665412,
      longitude: 139.712677,
      description: 'おしゃれなデートに最適なレストランです。',
      purposeCategoryNames: ['記念日', '夜のデート'],
    },
  ]

  for (const restaurantData of sampleRestaurants) {
    const { purposeCategoryNames, ...restaurantInfo } = restaurantData
    
    const { 
      priceRange, 
      customerSegment, 
      sideBySideSeats, 
      hotelDistanceWalk, 
      hotelDistanceTrain,
      ...restInfo 
    } = restaurantInfo
    const restaurant = await prisma.restaurants.create({
      data: {
        ...restInfo,
        price_range: priceRange,
        customer_segment: customerSegment,
        side_by_side_seats: sideBySideSeats,
        hotel_distance_walk: hotelDistanceWalk,
        hotel_distance_train: hotelDistanceTrain,
        id: randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    // 用途カテゴリとの関連付け
    for (const purposeName of purposeCategoryNames) {
      const purposeCategory = purposes.find((p) => p.name === purposeName)
      if (purposeCategory) {
            await prisma.restaurant_purposes.create({
          data: {
            restaurantId: restaurant.id,
            purposeCategoryId: purposeCategory.id,
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

