import 'dotenv/config'
import { PriceRange } from '@prisma/client'
import { randomUUID } from 'crypto'
import { prisma } from '../src/lib/prisma'

/**
 * 東京カレンダー（東カレ）に掲載されているグルメ店で、
 * ラブホテルからの距離条件を満たす店舗を収集してデータベースに追加するスクリプト
 */

// スクレイピングされたデータの構造
interface ScrapedTokyoCalendarRestaurant {
  name: string
  address: string // 駅名リスト（例: "銀座駅、日比谷駅..."）
  latitude: number | null
  longitude: number | null
  area: string
  url?: string
  description?: string
}

// データベースに保存するためのデータ構造
interface TokyoCalendarRestaurant {
  name: string
  address: string
  latitude: number
  longitude: number
  area: string
  priceRange: PriceRange
  atmosphere: string
  customerSegment: string
  sideBySideSeats: boolean
  hotelDistanceWalk: number
  hotelDistanceTrain: number | null
  description: string
  purposeCategoryNames: string[]
  tokyoCalendarUrl?: string
}

interface LoveHotel {
  name: string
  address: string
  latitude: number
  longitude: number
  area: string
}

/**
 * 2点間の距離（メートル）を計算（Haversine formula）
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * JSONファイルからスクレイピングされたレストラン情報を読み込む
 */
async function loadScrapedRestaurants(): Promise<ScrapedTokyoCalendarRestaurant[]> {
  const fs = await import('fs/promises')
  
  try {
    const data = await fs.readFile('scripts/tokyo-calendar-restaurants.json', 'utf-8')
    const restaurants = JSON.parse(data) as ScrapedTokyoCalendarRestaurant[]
    console.log(`✅ ${restaurants.length}件のスクレイピングデータを読み込みました`)
    return restaurants
  } catch (error) {
    console.error('⚠️  tokyo-calendar-restaurants.jsonが見つかりません。先にスクレイピングを実行してください。')
    console.error('  実行コマンド: npm run scrape:tokyo-calendar:raw')
    throw error
  }
}

/**
 * 住所から緯度・経度を取得（Google Geocoding API）
 */
async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('⚠️  GOOGLE_MAPS_API_KEYが設定されていません')
    return null
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=jp`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng,
      }
    } else {
      console.warn(`  ⚠️  Geocoding失敗: ${address} (${data.status})`)
      return null
    }
  } catch (error) {
    console.error(`  ❌ Geocodingエラー: ${address}`, error)
    return null
  }
}

/**
 * エリア名を住所から推定
 */
function estimateAreaFromAddress(address: string): string {
  const areaKeywords: { [key: string]: string } = {
    渋谷: '渋谷',
    新宿: '新宿',
    池袋: '池袋',
    表参道: '表参道',
    恵比寿: '恵比寿',
    六本木: '六本木',
    銀座: '銀座',
    東京駅: '東京駅周辺',
    有楽町: '東京駅周辺',
    日本橋: '東京駅周辺',
    丸の内: '東京駅周辺',
  }

  for (const [keyword, area] of Object.entries(areaKeywords)) {
    if (address.includes(keyword)) {
      return area
    }
  }
  return '渋谷'
}

/**
 * メイン処理
 */
async function main() {
  console.log('🌱 東京カレンダーグルメ店収集スクリプトを開始します...')
  console.log('📋 対象: ラブホテルからの距離条件を満たす東カレグルメ店')

  // データベースからラブホテル情報を取得
  // または、love-hotels.jsonから読み込む
  const fs = await import('fs/promises')
  let loveHotels: LoveHotel[] = []

  try {
    const data = await fs.readFile('scripts/love-hotels.json', 'utf-8')
    loveHotels = JSON.parse(data)
    console.log(`✅ ${loveHotels.length}件のラブホテル情報を読み込みました`)
  } catch (error) {
    console.log('⚠️  love-hotels.jsonが見つかりません。先にラブホテル情報を収集してください。')
    return
  }

  // スクレイピングされたデータを読み込む
  console.log('\n🔍 スクレイピングデータを読み込み中...')
  const scrapedRestaurants = await loadScrapedRestaurants()

  if (scrapedRestaurants.length === 0) {
    console.log('⚠️  グルメ店情報が取得できませんでした')
    return
  }

  // 各レストランについて、住所から緯度・経度を取得
  console.log('\n📍 住所から緯度・経度を取得中...')
  const tokyoCalendarRestaurants: TokyoCalendarRestaurant[] = []

  for (const scraped of scrapedRestaurants) {
    // 駅名リストから最初の駅名を住所として使用（Geocodingのため）
    const firstStation = scraped.address.split('、')[0]?.replace('駅', '') || scraped.address
    const geocodeAddressText = `${firstStation}駅 東京都` // より正確な検索のため

    let latitude = scraped.latitude
    let longitude = scraped.longitude

    // 緯度・経度が取得できていない場合は、Geocoding APIを使用
    if (!latitude || !longitude) {
      console.log(`  🔍 Geocoding中: ${scraped.name} (${geocodeAddressText})`)
      const location = await geocodeAddress(geocodeAddressText)
      if (location) {
        latitude = location.latitude
        longitude = location.longitude
        // APIレート制限を考慮して少し待機
        await new Promise((resolve) => setTimeout(resolve, 100))
      } else {
        console.log(`  ⚠️  スキップ: ${scraped.name} (Geocoding失敗)`)
        continue
      }
    }

    // データベース用のデータ構造に変換
    // デフォルト値を設定（詳細ページから取得する場合はここを変更）
    tokyoCalendarRestaurants.push({
      name: scraped.name,
      address: scraped.address, // 駅名リストのまま
      latitude,
      longitude,
      area: scraped.area,
      priceRange: PriceRange.BETWEEN_5000_10000, // デフォルト値（詳細ページから取得する場合は変更）
      atmosphere: '落ち着いた', // デフォルト値
      customerSegment: '30代〜40代', // デフォルト値
      sideBySideSeats: false, // デフォルト値（詳細ページから取得する場合は変更）
      hotelDistanceWalk: 0, // 後で計算
      hotelDistanceTrain: null,
      description: scraped.description || '',
      purposeCategoryNames: [], // デフォルト値（詳細ページから取得する場合は変更）
      tokyoCalendarUrl: scraped.url,
    })
  }

  console.log(`✅ ${tokyoCalendarRestaurants.length}件のグルメ店情報を準備しました`)

  // 用途カテゴリを取得
  const purposes = await prisma.purpose_categories.findMany()
  const purposeMap = new Map(purposes.map((p) => [p.name, p.id]))

  if (purposes.length === 0) {
    console.log('⚠️  用途カテゴリが存在しません。先にシードスクリプトを実行してください。')
    return
  }

  let totalRestaurantsAdded = 0
  const addedRestaurants = new Set<string>() // 重複チェック用（名前+住所）

  // 各ラブホテルについて、近くのグルメ店をフィルタリング
  console.log('\n📍 ラブホテルからの距離を計算中...')

  for (const hotel of loveHotels) {
    if (!hotel.latitude || !hotel.longitude) {
      console.log(`  ⚠️  スキップ: ${hotel.name} (位置情報がありません)`)
      continue
    }

    console.log(`\n🏨 処理中: ${hotel.name} (${hotel.area})`)

    // 各グルメ店との距離を計算
    const nearbyRestaurants = tokyoCalendarRestaurants
      .map((restaurant) => {
        const distance = calculateDistance(
          hotel.latitude,
          hotel.longitude,
          restaurant.latitude,
          restaurant.longitude
        )
        // 距離を設定
        restaurant.hotelDistanceWalk = Math.round(distance)
        return { restaurant, distance }
      })
      .filter(({ distance }) => {
        // 距離条件を満たす店舗をフィルタリング（例: 1000m以内）
        // TODO: 距離条件を設定可能にする
        return distance <= 1000 // 1000m以内
      })
      .map(({ restaurant }) => restaurant)

    if (nearbyRestaurants.length === 0) {
      console.log(`  ⚠️  距離条件を満たすグルメ店が見つかりませんでした`)
      continue
    }

    console.log(`  ✅ ${nearbyRestaurants.length}件のグルメ店が見つかりました`)

    // 各グルメ店をデータベースに追加
    for (const restaurant of nearbyRestaurants) {
      const key = `${restaurant.name}@${restaurant.address}`
      if (addedRestaurants.has(key)) {
        console.log(`  ⏭️  重複をスキップ: ${restaurant.name}`)
        continue
      }

      try {
        // 既存の店舗をチェック
        const existing = await prisma.restaurants.findFirst({
          where: {
            name: restaurant.name,
            address: restaurant.address,
          },
        })

        if (existing) {
          console.log(`  ⏭️  既に存在します: ${restaurant.name}`)
          addedRestaurants.add(key)
          continue
        }

        // 店舗を作成
        const createdRestaurant = await prisma.restaurants.create({
          data: {
            id: randomUUID(),
            name: restaurant.name,
            area: restaurant.area,
            address: restaurant.address,
            price_range: restaurant.priceRange,
            atmosphere: restaurant.atmosphere,
            customer_segment: restaurant.customerSegment,
            side_by_side_seats: restaurant.sideBySideSeats,
            hotel_distance_walk: restaurant.hotelDistanceWalk,
            hotel_distance_train: restaurant.hotelDistanceTrain,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            description: restaurant.description,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })

        // 用途カテゴリとの関連付け
        // デフォルトで「デート用」カテゴリを追加（purposeCategoryNamesが空の場合）
        const purposeNames = restaurant.purposeCategoryNames.length > 0
          ? restaurant.purposeCategoryNames
          : ['デート用'] // デフォルト値
        
        for (const purposeName of purposeNames) {
          const purposeId = purposeMap.get(purposeName)
          if (purposeId) {
            await prisma.restaurant_purposes
              .create({
                data: {
                  id: randomUUID(),
                  restaurant_id: createdRestaurant.id,
                  purpose_category_id: purposeId,
                  priority: 0,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              })
              .catch(() => {
                // 既に存在する場合はスキップ
              })
          }
        }

        console.log(`  ✅ 追加しました: ${restaurant.name} (${restaurant.hotelDistanceWalk}m)`)
        addedRestaurants.add(key)
        totalRestaurantsAdded++
      } catch (error) {
        console.error(`  ❌ エラー: ${restaurant.name}`, error)
      }
    }
  }

  console.log(`\n🎉 処理が完了しました！`)
  console.log(`📊 追加されたグルメ店: ${totalRestaurantsAdded}件`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



