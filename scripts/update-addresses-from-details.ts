import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { readFileSync, writeFileSync } from 'fs'

/**
 * 既存のJSONファイルのレストラン情報を更新
 * 詳細ページから住所・緯度・経度を取得して更新
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
 * 住所からエリア名を推定
 */
function estimateAreaFromAddress(address: string): string {
  const areaKeywords: { [key: string]: string } = {
    渋谷: '渋谷',
    新宿: '新宿',
    池袋: '池袋',
    表参道: '表参道',
    恵比寿: '恵比寿',
    六本木: '港区',
    銀座: '銀座',
    日本橋: '東京駅周辺',
    有楽町: '東京駅周辺',
    丸の内: '東京駅周辺',
    上野: '上野',
  }

  for (const [keyword, area] of Object.entries(areaKeywords)) {
    if (address.includes(keyword)) {
      return area
    }
  }
  
  return '渋谷' // デフォルト
}

async function updateAddressesFromDetails() {
  console.log('🌱 詳細ページから住所・緯度・経度を取得して更新します...')

  // JSONファイルを読み込む
  const jsonPath = 'scripts/tokyo-calendar-restaurants.json'
  const jsonData = readFileSync(jsonPath, 'utf-8')
  const restaurants: TokyoCalendarRestaurant[] = JSON.parse(jsonData)

  console.log(`📊 読み込んだレストラン数: ${restaurants.length}件`)

  // 住所が未取得または緯度・経度が未取得のレストランをフィルタ
  let needsUpdate = restaurants.filter(r => 
    r.url && (!r.address || r.address.includes('駅') || r.latitude === null || r.longitude === null)
  )

  // テストモード: 最初の10件だけ処理
  const TEST_MODE = process.env.TEST_MODE === 'true'
  if (TEST_MODE) {
    console.log('🧪 テストモード: 最初の10件だけ処理します')
    needsUpdate = needsUpdate.slice(0, 10)
  }

  console.log(`📋 更新が必要なレストラン数: ${needsUpdate.length}件`)

  if (needsUpdate.length === 0) {
    console.log('✅ すべてのレストランの住所・緯度・経度が取得済みです')
    return
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < needsUpdate.length; i++) {
    const restaurant = needsUpdate[i]
    const originalIndex = restaurants.findIndex(r => r.name === restaurant.name && r.area === restaurant.area)

    if (originalIndex === -1) {
      continue
    }

    try {
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 進捗: ${i + 1}/${needsUpdate.length}件 (成功: ${successCount}, エラー: ${errorCount})`)
      }

      // 詳細ページにアクセス
      await page.goto(restaurant.url!, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000)

      const detailHtml = await page.content()
      const $detail = cheerio.load(detailHtml)

      // 住所を取得
      let address = ''
      const addressSelectors = [
        '[class*="address"]',
        '.restaurant-address',
        '.address',
        '[data-address]',
      ]

      for (const selector of addressSelectors) {
        const addressElement = $detail(selector).first()
        if (addressElement.length > 0) {
          let text = addressElement.text().trim()
          text = text.replace(/^住所\s*/, '').trim()
          text = text.replace(/\s+/g, ' ').trim()
          if (text && text.length > 0 && text !== '住所') {
            address = text
            break
          }
        }
      }

      // 住所の重複を除去
      address = address.replace(/東京都東京都/g, '東京都')

      // 緯度・経度を取得
      let latitude: number | null = null
      let longitude: number | null = null

      const latAttr = $detail('[data-latitude]').first().attr('data-latitude')
      const lngAttr = $detail('[data-longitude]').first().attr('data-longitude')
      
      if (latAttr && lngAttr) {
        latitude = parseFloat(latAttr)
        longitude = parseFloat(lngAttr)
      } else {
        const scripts = $detail('script').toArray()
        for (const script of scripts) {
          const scriptContent = $detail(script).html() || ''
          
          const latLngMatch = scriptContent.match(/lat["\s:]*[:=]["\s]*([0-9.]+)["\s,]*lng["\s:]*[:=]["\s]*([0-9.]+)/i)
          if (latLngMatch) {
            latitude = parseFloat(latLngMatch[1])
            longitude = parseFloat(latLngMatch[2])
            break
          }

          const googleMapsMatch = scriptContent.match(/new\s+google\.maps\.LatLng\(([0-9.]+),\s*([0-9.]+)\)/i)
          if (googleMapsMatch) {
            latitude = parseFloat(googleMapsMatch[1])
            longitude = parseFloat(googleMapsMatch[2])
            break
          }
        }
      }

      // データを更新
      if (address && address.length > 0) {
        restaurants[originalIndex].address = address
        const estimatedArea = estimateAreaFromAddress(address)
        if (estimatedArea) {
          restaurants[originalIndex].area = estimatedArea
        }
      }

      if (latitude !== null && longitude !== null) {
        restaurants[originalIndex].latitude = latitude
        restaurants[originalIndex].longitude = longitude
      }

      successCount++

      // サーバー負荷を軽減
      await page.waitForTimeout(1000)

    } catch (error) {
      errorCount++
      console.warn(`  ⚠️  ${restaurant.name} の取得エラー:`, error)
    }
  }

  await browser.close()

  // 更新したデータを保存
  writeFileSync(jsonPath, JSON.stringify(restaurants, null, 2), 'utf-8')

  console.log(`\n🎉 更新が完了しました！`)
  console.log(`📊 結果:`)
  console.log(`  - 成功: ${successCount}件`)
  console.log(`  - エラー: ${errorCount}件`)
  console.log(`  - 合計: ${needsUpdate.length}件`)
  console.log(`📁 保存先: ${jsonPath}`)
}

updateAddressesFromDetails()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
