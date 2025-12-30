// .envファイルを明示的に読み込む
import 'dotenv/config'
import { PrismaClient, PriceRange } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Prisma 7では、adapterを使用してPrismaClientを初期化する必要があります
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * ハッピーホテルサイト（https://happyhotel.jp/）に掲載されているラブホテルから
 * 100m以内のシーシャバーを検索してデータベースに追加するスクリプト
 */

interface LoveHotel {
  name: string
  address: string
  latitude: number
  longitude: number
  area: string
}

interface ShishaBar {
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
 * 住所から緯度・経度を取得（Google Geocoding API）
 */
async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn(`Google Maps APIキーが設定されていません: ${address}`)
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=ja`
    )
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { latitude: location.lat, longitude: location.lng }
    } else {
      console.warn(`Geocoding failed (${data.status}): ${address}`)
      return null
    }
  } catch (error) {
    console.error(`Geocoding error: ${address}`, error)
    return null
  }
}

/**
 * ラブホテルから100m以内のシーシャバーを検索（Google Places API）
 */
async function findShishaBarsNearby(
  latitude: number,
  longitude: number,
  radius: number = 100,
  hotelArea: string
): Promise<ShishaBar[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn(`Google Maps APIキーが設定されていません`)
    return []
  }

  const shishaBars: ShishaBar[] = []
  const keywords = ['シーシャバー', 'シーシャ バー', 'shisha bar', '水タバコ']

  for (const keyword of keywords) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&language=ja&key=${apiKey}`
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          // 既に追加済みかチェック（place_idで）
          if (shishaBars.some((sb) => sb.name === place.name && sb.address === place.vicinity)) {
            continue
          }

          const estimatedArea = estimateAreaFromAddress(place.vicinity || place.formatted_address || '') || hotelArea
          const shishaBar = createDefaultShishaBarInfo(
            place.name,
            place.vicinity || place.formatted_address || '',
            place.geometry.location.lat,
            place.geometry.location.lng,
            estimatedArea,
            latitude,
            longitude
          )

          shishaBars.push(shishaBar)
        }
      } else if (data.status !== 'ZERO_RESULTS') {
        console.warn(`Places API search failed (${data.status}) for keyword: ${keyword}`)
      }

      // APIレート制限を避けるため、少し待機
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Places API error for keyword: ${keyword}`, error)
    }
  }

  return shishaBars
}

/**
 * エリア名を住所から推定
 */
function estimateAreaFromAddress(address: string): string | null {
  const areaKeywords: { [key: string]: string } = {
    渋谷: '渋谷',
    新宿: '新宿',
    新大久保: '新大久保',
    表参道: '表参道',
    恵比寿: '恵比寿',
    六本木: '港区',
    港区: '港区',
    銀座: '銀座',
    池袋: '池袋',
    豊島区: '池袋',
    上野: '上野',
    台東区: '上野',
    横浜: '横浜',
    東京駅: '東京駅周辺',
    有楽町: '東京駅周辺',
    日本橋: '東京駅周辺',
    丸の内: '東京駅周辺',
  }

  // 優先順位: より具体的なキーワードを先にチェック
  if (address.includes('新大久保')) {
    return '新大久保'
  }
  if (address.includes('豊島区') || address.includes('池袋')) {
    return '池袋'
  }
  if (address.includes('上野') || address.includes('台東区')) {
    return '上野'
  }
  if (address.includes('横浜')) {
    return '横浜'
  }
  if (address.includes('港区') || address.includes('六本木')) {
    return '港区'
  }

  for (const [keyword, area] of Object.entries(areaKeywords)) {
    if (address.includes(keyword)) {
      return area
    }
  }
  
  return null // 推定できない場合はnullを返す
}

/**
 * シーシャバーのデフォルト情報を生成
 */
function createDefaultShishaBarInfo(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  area: string,
  hotelLatitude: number,
  hotelLongitude: number
): ShishaBar {
  const distance = calculateDistance(hotelLatitude, hotelLongitude, latitude, longitude)

  return {
    name,
    address,
    latitude,
    longitude,
    area,
    priceRange: PriceRange.BETWEEN_3000_5000, // デフォルト値、実際の情報で更新
    atmosphere: '落ち着いた雰囲気',
    customerSegment: '20代-30代',
    sideBySideSeats: true, // シーシャバーは横並び席が多い
    hotelDistanceWalk: Math.round(distance), // 距離をメートルで保存
    hotelDistanceTrain: null,
    description: 'デートに最適なシーシャバーです。',
    purposeCategoryNames: ['夜のデート', 'カジュアルデート'],
  }
}

/**
 * love-hotels.jsonからラブホテル情報を読み込む
 */
async function loadLoveHotels(): Promise<LoveHotel[]> {
  const fs = await import('fs/promises')
  try {
    const jsonData = await fs.readFile('scripts/love-hotels.json', 'utf-8')
    const hotels = JSON.parse(jsonData)
    
    // 緯度・経度がない場合はGeocoding APIで取得
    const loveHotels: LoveHotel[] = []
    for (const hotel of hotels) {
      let lat = hotel.latitude
      let lon = hotel.longitude
      
      if (!lat || !lon) {
        const location = await geocodeAddress(hotel.address)
        if (location) {
          lat = location.latitude
          lon = location.longitude
        } else {
          console.warn(`緯度・経度を取得できませんでした: ${hotel.name} - ${hotel.address}`)
          continue
        }
        
        // APIレート制限を避けるため、少し待機
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
      
      loveHotels.push({
        name: hotel.name,
        address: hotel.address,
        latitude: lat,
        longitude: lon,
        area: hotel.area,
      })
    }
    
    return loveHotels
  } catch (error) {
    console.error('love-hotels.jsonの読み込みエラー:', error)
    return []
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🌱 シーシャバー収集スクリプトを開始します...')
  console.log('📋 ハッピーホテルサイト: https://happyhotel.jp/')

  // love-hotels.jsonからラブホテル情報を読み込む
  console.log('\n📂 love-hotels.jsonからラブホテル情報を読み込み中...')
  const loveHotels = await loadLoveHotels()

  if (loveHotels.length === 0) {
    console.log('\n⚠️  ラブホテルのリストが空です。')
    console.log('\n📝 次のステップ:')
    console.log('1. scripts/scrape-love-hotels.ts を実行してラブホテル情報を取得')
    console.log('2. scripts/love-hotels.json を確認')
    return
  }

  console.log(`✅ ${loveHotels.length}件のラブホテルを読み込みました`)

  console.log(`\n📋 ${loveHotels.length}件のラブホテルを処理します...`)

  // 用途カテゴリを取得
  const purposes = await prisma.purpose_categories.findMany()
  const purposeMap = new Map(purposes.map((p) => [p.name, p.id]))

  if (purposes.length === 0) {
    console.log('⚠️  用途カテゴリが存在しません。先にシードスクリプトを実行してください。')
    return
  }

  let totalShishaBarsAdded = 0
  const addedShishaBars = new Set<string>() // 重複チェック用（名前+住所）

  // 各ラブホテルについて処理
  for (const hotel of loveHotels) {
    console.log(`\n🏨 処理中: ${hotel.name} (${hotel.area})`)

    // 100m以内のシーシャバーを検索
    const nearbyShishaBars = await findShishaBarsNearby(
      hotel.latitude,
      hotel.longitude,
      100,
      hotel.area
    )

    if (nearbyShishaBars.length === 0) {
      console.log(`  ⚠️  100m以内にシーシャバーが見つかりませんでした`)
      continue
    }

    console.log(`  ✅ ${nearbyShishaBars.length}件のシーシャバーが見つかりました`)

    // 各シーシャバーをデータベースに追加
    for (const shishaBar of nearbyShishaBars) {
      const key = `${shishaBar.name}@${shishaBar.address}`
      if (addedShishaBars.has(key)) {
        console.log(`  ⏭️  重複をスキップ: ${shishaBar.name}`)
        continue
      }

      try {
        // 既存の店舗をチェック（名前と住所で）
        const existing = await prisma.restaurants.findFirst({
          where: {
            name: shishaBar.name,
            address: shishaBar.address,
          },
        })

        if (existing) {
          console.log(`  ⏭️  既に存在します: ${shishaBar.name}`)
          addedShishaBars.add(key)
          continue
        }

        // 店舗を作成
        const restaurant = await prisma.restaurants.create({
          data: {
            name: shishaBar.name,
            area: shishaBar.area,
            address: shishaBar.address,
            priceRange: shishaBar.priceRange,
            atmosphere: shishaBar.atmosphere,
            customerSegment: shishaBar.customerSegment,
            sideBySideSeats: shishaBar.sideBySideSeats,
            hotelDistanceWalk: shishaBar.hotelDistanceWalk,
            hotelDistanceTrain: shishaBar.hotelDistanceTrain,
            latitude: shishaBar.latitude,
            longitude: shishaBar.longitude,
            description: shishaBar.description,
            isActive: true,
          },
        })

        // 用途カテゴリとの関連付け
        for (const purposeName of shishaBar.purposeCategoryNames) {
          const purposeId = purposeMap.get(purposeName)
          if (purposeId) {
            await prisma.restaurant_purposes
              .create({
                data: {
                  restaurantId: restaurant.id,
                  purposeCategoryId: purposeId,
                  priority: 0,
                },
              })
              .catch(() => {
                // 既に存在する場合はスキップ
              })
          }
        }

        console.log(`  ✅ 追加しました: ${shishaBar.name} (${shishaBar.hotelDistanceWalk}m)`)
        addedShishaBars.add(key)
        totalShishaBarsAdded++
      } catch (error) {
        console.error(`  ❌ エラー: ${shishaBar.name}`, error)
      }
    }
  }

  console.log(`\n🎉 処理が完了しました！`)
  console.log(`📊 追加されたシーシャバー: ${totalShishaBarsAdded}件`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
