import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

/**
 * グルカレ by 東京カレンダー（https://gourmet-calendar.com/）
 * からレストラン情報をスクレイピングするスクリプト
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
 * グルカレサイトからレストラン情報をスクレイピング
 * @param placeCode エリアコード（例: 8=渋谷）
 */
async function scrapeTokyoCalendarRestaurants(placeCode: number = 8): Promise<TokyoCalendarRestaurant[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const restaurants: TokyoCalendarRestaurant[] = []
  
  try {
    // 検索マップページにアクセス（東京カレンダーに掲載されたお店）
    // エリアコード例: 8=渋谷
    const url = `https://gourmet-calendar.com/restaurants/search_map?place_codes[]=${placeCode}&sort=new`
    console.log(`🔍 ${url} にアクセス中...`)
    
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000) // コンテンツが読み込まれるまで待機

    // スクロールして追加コンテンツを読み込む
    console.log('📜 スクロールして追加コンテンツを読み込み中...')
    
    // 最初にレストラン要素が読み込まれるまで待機
    try {
      await page.waitForSelector('.large-restaurant-wrap', { timeout: 10000 })
    } catch (e) {
      console.log('  ⚠️  レストラン要素が見つかりません。スクロール処理を開始します...')
    }
    
    let previousRestaurantCount = -1
    let noChangeCount = 0
    const maxNoChangeCount = 3 // 3回連続で変化がなければ終了

    for (let scrollAttempt = 0; scrollAttempt < 30; scrollAttempt++) {
      // 現在のレストラン数をカウント
      const currentRestaurantCount = await page.locator('.large-restaurant-wrap').count()
      
      if (currentRestaurantCount > 0 && currentRestaurantCount === previousRestaurantCount) {
        noChangeCount++
        if (noChangeCount >= maxNoChangeCount) {
          console.log(`  ✅ 追加コンテンツの読み込みが完了しました（${currentRestaurantCount}件）`)
          break
        }
      } else {
        noChangeCount = 0
        if (currentRestaurantCount > 0) {
          console.log(`  📊 現在のレストラン数: ${currentRestaurantCount}件`)
        }
      }

      previousRestaurantCount = currentRestaurantCount

      // ページの最下部までスクロール
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      // 次のコンテンツが読み込まれるまで待機
      await page.waitForTimeout(3000) // 待機時間を長くする

      // ローディングインジケーターを待つ（もしあれば）
      try {
        await page.waitForSelector('#page_loader', { state: 'hidden', timeout: 5000 }).catch(() => {})
      } catch (e) {
        // ローディングインジケーターがない場合は無視
      }
    }

    // 最終的なHTMLを取得
    const html = await page.content()
    const $ = cheerio.load(html)

    // レストランカードを取得（.large-restaurant-wrap）
    $('.large-restaurant-wrap').each((index, element) => {
      try {
        const $wrap = $(element)
        
        // レストランIDを取得
        const restaurantId = $wrap.attr('id')?.replace('restaurant_', '')
        if (!restaurantId) {
          return
        }
        
        // レストラン名を取得
        const name = $wrap.find('.restaurant-name').first().text().trim()
        if (!name || name.length === 0) {
          return
        }
        
        // 詳細ページのURLを取得
        const href = $wrap.find('.restaurant-link').first().attr('href')
        const restaurantUrl = href ? (href.startsWith('http') ? href : `https://gourmet-calendar.com${href}`) : undefined
        
        // 住所・エリア情報を取得（.restaurant-city_area）
        const cityAreaText = $wrap.find('.restaurant-city_area p').first().text().trim()
        // 駅名のリスト（例: "銀座駅、日比谷駅、有楽町駅..."）からエリアを推定
        const area = estimateAreaFromStations(cityAreaText)
        
        // 住所は詳細ページから取得する必要がある（現在はエリアのみ）
        const address = '' // 詳細ページから取得
        
        // ジャンル情報（参考用）
        const cuisines = $wrap.find('.restaurant-cuisines p').first().text().trim()
        
        // 価格情報（参考用）
        const priceDinner = $wrap.find('.restaurant-price_dinner span').first().text().trim()
        const priceLunch = $wrap.find('.restaurant-price_lunch span').first().text().trim()
        
        restaurants.push({
          name,
          address: address || cityAreaText, // 暫定的に駅名リストを使用
          latitude: null, // 詳細ページから取得する必要がある
          longitude: null, // 詳細ページから取得する必要がある
          area: area || '渋谷',
          url: restaurantUrl,
          description: cuisines ? `${cuisines}${priceDinner ? ` (ディナー: ${priceDinner})` : ''}` : undefined,
        })
      } catch (error) {
        console.warn(`レストラン情報の取得エラー:`, error)
      }
    })

    console.log(`✅ ${restaurants.length}件のレストラン情報を取得しました`)

    // 詳細ページにアクセスして住所・緯度・経度を取得
    console.log(`\n📄 詳細ページから住所・緯度・経度を取得中...`)
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i]
      if (!restaurant.url) {
        console.log(`  ⚠️  ${restaurant.name}: URLがありません`)
        continue
      }

      try {
        console.log(`  [${i + 1}/${restaurants.length}] ${restaurant.name} の詳細を取得中...`)
        
        // 詳細ページにアクセス
        await page.goto(restaurant.url, { waitUntil: 'networkidle' })
        await page.waitForTimeout(2000) // コンテンツが読み込まれるまで待機

        const detailHtml = await page.content()
        const $detail = cheerio.load(detailHtml)

        // 住所を取得（複数のセレクターを試す）
        let address = ''
        const addressSelectors = [
          '[class*="address"]',
          '.restaurant-address',
          '.address',
          '[data-address]',
          '.restaurant-info .address',
          '.restaurant-detail .address',
        ]

        for (const selector of addressSelectors) {
          const addressElement = $detail(selector).first()
          if (addressElement.length > 0) {
            let text = addressElement.text().trim()
            // 「住所」ラベルを除去
            text = text.replace(/^住所\s*/, '').trim()
            // 改行や余分な空白を整理
            text = text.replace(/\s+/g, ' ').trim()
            if (text && text.length > 0 && text !== '住所') {
              address = text
              break
            }
          }
        }

        // 住所が見つからない場合は、テキストから住所らしい部分を探す
        if (!address || address.length === 0) {
          const bodyText = $detail('body').text()
          // 郵便番号や「東京都」で始まる住所パターンを探す
          const addressMatch = bodyText.match(/東京都[^\n]{0,50}/)
          if (addressMatch) {
            address = addressMatch[0].trim()
          }
        }

        // 住所の重複を除去（例: "東京都東京都" → "東京都"）
        address = address.replace(/東京都東京都/g, '東京都')

        // 緯度・経度を取得（data属性やscriptタグから）
        let latitude: number | null = null
        let longitude: number | null = null

        // data属性から取得を試す
        const latAttr = $detail('[data-latitude]').first().attr('data-latitude')
        const lngAttr = $detail('[data-longitude]').first().attr('data-longitude')
        
        if (latAttr && lngAttr) {
          latitude = parseFloat(latAttr)
          longitude = parseFloat(lngAttr)
        } else {
          // scriptタグから取得を試す（Google Mapsや地図ライブラリの初期化コードから）
          const scripts = $detail('script').toArray()
          for (const script of scripts) {
            const scriptContent = $detail(script).html() || ''
            
            // より詳細なパターンを試す
            // パターン1: lat: 35.xxx, lng: 139.xxx
            const latLngMatch = scriptContent.match(/lat["\s:]*[:=]["\s]*([0-9.]+)["\s,]*lng["\s:]*[:=]["\s]*([0-9.]+)/i)
            if (latLngMatch) {
              latitude = parseFloat(latLngMatch[1])
              longitude = parseFloat(latLngMatch[2])
              break
            }

            // パターン2: latitude: 35.xxx, longitude: 139.xxx
            const latLongMatch = scriptContent.match(/latitude["\s:]*[:=]["\s]*([0-9.]+)["\s,]*longitude["\s:]*[:=]["\s]*([0-9.]+)/i)
            if (latLongMatch) {
              latitude = parseFloat(latLongMatch[1])
              longitude = parseFloat(latLongMatch[2])
              break
            }

            // パターン3: 緯度・経度のパターンを探す
            const latMatch = scriptContent.match(/lat(itude)?["\s:=]+([0-9.]+)/i)
            const lngMatch = scriptContent.match(/lng|lon(gitude)?["\s:=]+([0-9.]+)/i)
            
            if (latMatch && lngMatch) {
              latitude = parseFloat(latMatch[2] || latMatch[1])
              longitude = parseFloat(lngMatch[2] || lngMatch[1])
              break
            }

            // パターン4: 配列形式 [緯度, 経度] を探す
            const coordMatch = scriptContent.match(/\[([0-9.]+),\s*([0-9.]+)\]/)
            if (coordMatch) {
              latitude = parseFloat(coordMatch[1])
              longitude = parseFloat(coordMatch[2])
              break
            }

            // パターン5: new google.maps.LatLng(35.xxx, 139.xxx)
            const googleMapsMatch = scriptContent.match(/new\s+google\.maps\.LatLng\(([0-9.]+),\s*([0-9.]+)\)/i)
            if (googleMapsMatch) {
              latitude = parseFloat(googleMapsMatch[1])
              longitude = parseFloat(googleMapsMatch[2])
              break
            }
          }
        }

        // 緯度・経度が取得できなかった場合は、住所からGoogle Maps Geocoding APIで取得する
        // （今回は実装しないが、将来的に追加可能）

        // 住所からエリアを再推定（詳細な住所が取得できた場合）
        if (address && address.length > 0) {
          restaurant.address = address
          const estimatedArea = estimateAreaFromAddress(address)
          if (estimatedArea) {
            restaurant.area = estimatedArea
          }
        }

        // 緯度・経度を更新
        if (latitude !== null && longitude !== null) {
          restaurant.latitude = latitude
          restaurant.longitude = longitude
          console.log(`    ✅ 住所: ${address || '未取得'}, 緯度: ${latitude}, 経度: ${longitude}`)
        } else {
          console.log(`    ⚠️  住所: ${address || '未取得'}, 緯度・経度: 未取得`)
        }

        // サーバー負荷を軽減するため、少し待機
        await page.waitForTimeout(1000)

      } catch (error) {
        console.warn(`    ❌ ${restaurant.name} の詳細取得エラー:`, error)
      }
    }

    console.log(`\n✅ 詳細情報の取得が完了しました`)

  } catch (error) {
    console.error('スクレイピングエラー:', error)
  } finally {
    await browser.close()
  }

  return restaurants
}

/**
 * 駅名リストからエリア名を推定
 */
function estimateAreaFromStations(stationsText: string): string {
  const stationAreaMap: { [key: string]: string } = {
    渋谷: '渋谷',
    新宿: '新宿',
    池袋: '池袋',
    表参道: '表参道',
    恵比寿: '恵比寿',
    六本木: '港区',
    銀座: '銀座',
    日比谷: '銀座',
    有楽町: '東京駅周辺',
    内幸町: '東京駅周辺',
    東銀座: '銀座',
    新橋: '東京駅周辺',
    日本橋: '東京駅周辺',
    丸の内: '東京駅周辺',
    上野: '上野',
    横浜: '横浜',
  }

  // 駅名リストから最初の駅名を取得してエリアを推定
  for (const [station, area] of Object.entries(stationAreaMap)) {
    if (stationsText.includes(station)) {
      return area
    }
  }
  
  return '渋谷' // デフォルト
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

/**
 * メイン処理
 */
async function main() {
  console.log('🌱 東京カレンダーグルメ店スクレイピングスクリプトを開始します...')
  console.log('📋 対象: グルカレ by 東京カレンダー')

  // エリアコードとエリア名のマッピング
  const areas = [
    { code: 8, name: '渋谷' },
    { code: 11, name: '新宿' },
    { code: 15, name: '池袋' },
    { code: 7, name: '恵比寿' },
    { code: 480, name: '六本木' },
    { code: 433, name: '銀座' },
    { code: 3, name: '上野' },
  ]

  const allRestaurants: TokyoCalendarRestaurant[] = []

  // 各エリアを順次スクレイピング
  for (const area of areas) {
    console.log(`\n📍 エリア: ${area.name}（place_code=${area.code}）`)
    const restaurants = await scrapeTokyoCalendarRestaurants(area.code)
    
    if (restaurants.length > 0) {
      console.log(`  ✅ ${restaurants.length}件のレストラン情報を取得しました`)
      allRestaurants.push(...restaurants)
      
      // エリア間で少し待機（サーバー負荷を軽減）
      if (area.code !== areas[areas.length - 1].code) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } else {
      console.log(`  ⚠️  レストラン情報が取得できませんでした`)
    }
  }

  if (allRestaurants.length === 0) {
    console.log('⚠️  レストラン情報が取得できませんでした')
    console.log('💡 HTML構造を確認して、セレクターを調整してください')
    return
  }

  // JSONファイルに保存
  const fs = await import('fs/promises')
  await fs.writeFile(
    'scripts/tokyo-calendar-restaurants.json',
    JSON.stringify(allRestaurants, null, 2),
    'utf-8'
  )

  console.log(`\n🎉 処理が完了しました！`)
  console.log(`📊 取得したレストラン数: ${allRestaurants.length}件`)
  console.log(`📁 保存先: scripts/tokyo-calendar-restaurants.json`)
  
  // エリア別の集計
  const areaCounts = new Map<string, number>()
  allRestaurants.forEach(r => {
    areaCounts.set(r.area, (areaCounts.get(r.area) || 0) + 1)
  })
  
  console.log(`\n📊 エリア別集計:`)
  areaCounts.forEach((count, area) => {
    console.log(`  - ${area}: ${count}件`)
  })
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
