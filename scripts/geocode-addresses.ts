import 'dotenv/config'
import { readFileSync, writeFileSync } from 'fs'

/**
 * Google Maps Geocoding APIを使用して住所から緯度・経度を取得
 */

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
 * Google Maps Geocoding APIで住所から緯度・経度を取得
 */
async function geocodeAddress(address: string, apiKey: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=jp&language=ja`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng,
      }
    } else {
      console.warn(`  ⚠️  Geocoding失敗: ${data.status} - ${address}`)
      return null
    }
  } catch (error) {
    console.error(`  ❌ Geocodingエラー: ${address}`, error)
    return null
  }
}

async function geocodeAddresses() {
  console.log('🌍 Google Maps Geocoding APIで住所から緯度・経度を取得します...')

  // APIキーの確認
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEYが環境変数に設定されていません')
    console.log('💡 .envファイルに以下を追加してください:')
    console.log('   GOOGLE_MAPS_API_KEY=your-api-key-here')
    process.exit(1)
  }

  // JSONファイルを読み込む
  const jsonPath = 'scripts/tokyo-calendar-restaurants.json'
  const jsonData = readFileSync(jsonPath, 'utf-8')
  const restaurants: TokyoCalendarRestaurant[] = JSON.parse(jsonData)

  console.log(`📊 読み込んだレストラン数: ${restaurants.length}件`)

  // 緯度・経度が未取得のレストランをフィルタ
  const needsGeocode = restaurants.filter(r => 
    r.address && 
    r.address.length > 0 && 
    !r.address.includes('駅') && 
    (r.latitude === null || r.longitude === null)
  )

  console.log(`📋 Geocodingが必要なレストラン数: ${needsGeocode.length}件`)

  if (needsGeocode.length === 0) {
    console.log('✅ すべてのレストランの緯度・経度が取得済みです')
    return
  }

  // テストモード: 最初の10件だけ処理
  const TEST_MODE = process.env.TEST_MODE === 'true'
  let targetRestaurants = needsGeocode
  if (TEST_MODE) {
    console.log('🧪 テストモード: 最初の10件だけ処理します')
    targetRestaurants = needsGeocode.slice(0, 10)
  }

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < targetRestaurants.length; i++) {
    const restaurant = targetRestaurants[i]
    const originalIndex = restaurants.findIndex(r => 
      r.name === restaurant.name && r.area === restaurant.area
    )

    if (originalIndex === -1) {
      continue
    }

    try {
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 進捗: ${i + 1}/${targetRestaurants.length}件 (成功: ${successCount}, エラー: ${errorCount})`)
      }

      console.log(`  [${i + 1}/${targetRestaurants.length}] ${restaurant.name}`)
      console.log(`    住所: ${restaurant.address}`)

      const coordinates = await geocodeAddress(restaurant.address, apiKey)

      if (coordinates) {
        restaurants[originalIndex].latitude = coordinates.latitude
        restaurants[originalIndex].longitude = coordinates.longitude
        console.log(`    ✅ 緯度: ${coordinates.latitude}, 経度: ${coordinates.longitude}`)
        successCount++
      } else {
        errorCount++
      }

      // APIレート制限を考慮して待機（1秒に1リクエスト）
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      errorCount++
      console.error(`  ❌ エラー: ${restaurant.name}`, error)
    }
  }

  // 更新したデータを保存
  writeFileSync(jsonPath, JSON.stringify(restaurants, null, 2), 'utf-8')

  console.log(`\n🎉 Geocodingが完了しました！`)
  console.log(`📊 結果:`)
  console.log(`  - 成功: ${successCount}件`)
  console.log(`  - エラー: ${errorCount}件`)
  console.log(`  - 合計: ${targetRestaurants.length}件`)
  console.log(`📁 保存先: ${jsonPath}`)
}

geocodeAddresses()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
