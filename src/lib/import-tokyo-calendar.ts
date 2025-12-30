import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'
import { PriceRange } from '@prisma/client'
import { prisma } from './prisma'

interface TokyoCalendarRestaurant {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  area: string
  url?: string
  description?: string
}

/**
 * 価格帯を推定する関数
 */
function estimatePriceRange(description: string | undefined): PriceRange {
  if (!description) {
    return PriceRange.BETWEEN_3000_5000 // デフォルト
  }

  // ディナーの価格情報を抽出
  const dinnerMatch = description.match(/ディナー[：:]\s*約?(\d+)[,，]?(\d+)?円/)
  if (dinnerMatch) {
    const price = parseInt(dinnerMatch[1] + (dinnerMatch[2] || ''))
    if (price < 3000) return PriceRange.UNDER_3000
    if (price < 5000) return PriceRange.BETWEEN_3000_5000
    if (price < 10000) return PriceRange.BETWEEN_5000_10000
    return PriceRange.OVER_10000
  }

  // ランチの価格情報を抽出（ディナーがない場合）
  const lunchMatch = description.match(/ランチ[：:]\s*約?(\d+)[,，]?(\d+)?円/)
  if (lunchMatch) {
    const price = parseInt(lunchMatch[1] + (lunchMatch[2] || ''))
    // ランチ価格をディナー価格に換算（約2倍）
    const estimatedDinnerPrice = price * 2
    if (estimatedDinnerPrice < 3000) return PriceRange.UNDER_3000
    if (estimatedDinnerPrice < 5000) return PriceRange.BETWEEN_3000_5000
    if (estimatedDinnerPrice < 10000) return PriceRange.BETWEEN_5000_10000
    return PriceRange.OVER_10000
  }

  // 価格情報がない場合はデフォルト
  return PriceRange.BETWEEN_3000_5000
}

/**
 * エリア名からデフォルトの緯度・経度を取得
 */
function getDefaultCoordinates(area: string): { latitude: number; longitude: number } {
  const areaCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    渋谷: { latitude: 35.658034, longitude: 139.701636 },
    新宿: { latitude: 35.690921, longitude: 139.700258 },
    池袋: { latitude: 35.729502, longitude: 139.710900 },
    恵比寿: { latitude: 35.646690, longitude: 139.710106 },
    六本木: { latitude: 35.662690, longitude: 139.731364 },
    港区: { latitude: 35.662690, longitude: 139.731364 },
    銀座: { latitude: 35.671946, longitude: 139.765483 },
    東京駅周辺: { latitude: 35.681236, longitude: 139.767125 },
    上野: { latitude: 35.713768, longitude: 139.777254 },
    表参道: { latitude: 35.665412, longitude: 139.712677 },
  }

  return areaCoordinates[area] || { latitude: 35.658034, longitude: 139.701636 } // デフォルト: 渋谷
}

/**
 * 東京カレンダーのデータをインポート
 */
async function importTokyoCalendarData() {
  console.log('🌱 東京カレンダーのデータをインポート開始...')

  // JSONファイルを読み込む
  const jsonPath = resolve(process.cwd(), 'scripts/tokyo-calendar-restaurants.json')
  console.log(`📁 JSONファイルを読み込み中: ${jsonPath}`)

  const jsonData = readFileSync(jsonPath, 'utf-8')
  const restaurants: TokyoCalendarRestaurant[] = JSON.parse(jsonData)

  console.log(`📊 読み込んだレストラン数: ${restaurants.length}件`)

  // 用途カテゴリを取得（既に存在することを前提）
  const purposeCategories = await prisma.purpose_categories.findMany()
  if (purposeCategories.length === 0) {
    console.error('❌ 用途カテゴリが存在しません。先にシードスクリプトを実行してください。')
    process.exit(1)
  }

  console.log(`✅ 用途カテゴリ: ${purposeCategories.length}件`)

  // バッチ処理でデータを投入
  const batchSize = 100
  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize)
    console.log(`\n📦 バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(restaurants.length / batchSize)} を処理中...`)

    for (const restaurantData of batch) {
      try {
        // 既存の店舗をチェック（名前とエリアで重複チェック）
        const existing = await prisma.restaurants.findFirst({
          where: {
            name: restaurantData.name,
            area: restaurantData.area,
          },
        })

        if (existing) {
          skipCount++
          continue
        }

        // 価格帯を推定
        const priceRange = estimatePriceRange(restaurantData.description)

        // 緯度・経度を取得（nullの場合はエリアのデフォルト座標を使用）
        const coordinates = restaurantData.latitude && restaurantData.longitude
          ? { latitude: restaurantData.latitude, longitude: restaurantData.longitude }
          : getDefaultCoordinates(restaurantData.area)

        // 住所を整形（駅名のみの場合はエリア名を使用）
        const address = restaurantData.address.includes('駅')
          ? `${restaurantData.area}${restaurantData.address}`
          : restaurantData.address || restaurantData.area

        // 店舗データを作成
        const restaurant = await prisma.restaurants.create({
          data: {
            id: randomUUID(),
            name: restaurantData.name,
            area: restaurantData.area,
            address: address,
            price_range: priceRange,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            description: restaurantData.description || undefined,
            website_url: restaurantData.url || undefined,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })

        // デフォルトで「カジュアルデート」の用途カテゴリを関連付け
        const casualDateCategory = purposeCategories.find((p) => p.name === 'カジュアルデート')
        if (casualDateCategory) {
          await prisma.restaurant_purposes.create({
            data: {
              id: randomUUID(),
              restaurant_id: restaurant.id,
              purpose_category_id: casualDateCategory.id,
              priority: 0,
              created_at: new Date(),
            },
          }).catch(() => {
            // 既に存在する場合はスキップ
          })
        }

        successCount++
      } catch (error) {
        errorCount++
        console.error(`  ❌ エラー: ${restaurantData.name}`, error)
      }
    }

    // 進捗を表示
    const processed = Math.min(i + batchSize, restaurants.length)
    console.log(`  ✅ 処理済み: ${processed}/${restaurants.length}件 (成功: ${successCount}, スキップ: ${skipCount}, エラー: ${errorCount})`)
  }

  console.log('\n🎉 インポートが完了しました！')
  console.log(`📊 結果:`)
  console.log(`  - 成功: ${successCount}件`)
  console.log(`  - スキップ（重複）: ${skipCount}件`)
  console.log(`  - エラー: ${errorCount}件`)
  console.log(`  - 合計: ${restaurants.length}件`)
}

// メイン処理
importTokyoCalendarData()
  .catch((e) => {
    console.error('❌ インポート中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
