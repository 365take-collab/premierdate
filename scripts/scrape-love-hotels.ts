import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

/**
 * ハッピーホテルサイト（https://happyhotel.jp/）から
 * ラブホテル情報をスクレイピングするスクリプト
 */

interface LoveHotel {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  area: string
  url?: string
}

/**
 * 駅名からハッピーホテルサイトの検索URLを生成
 * 駅名で検索する場合のURL形式: /search/kodawari/list?station_id={station_id}
 */
function getStationSearchUrl(stationName: string): string {
  const baseUrl = 'https://happyhotel.jp'
  
  // 駅名とstation_idのマッピング
  // 渋谷駅: 1311302000100001（ユーザー提供）
  // 新宿駅: 1310404600300000（スクリーンショットから確認）
  // 東新宿駅: 1310407900100010（ユーザー提供）
  // 上野駅: 1310600700700001（ユーザー提供）
  // 池袋駅: 1311601700100028（ユーザー提供）
  // 六本木駅: 1310302900600001（ユーザー提供）
  // 恵比寿駅: 1311300600100005（ユーザー提供）
  // 横浜駅: 1410301600200000（ユーザー提供）
  const stationIdMapping: { [key: string]: string } = {
    '渋谷': '1311302000100001',
    '新宿': '1310404600300000',
    '東新宿': '1310407900100010',
    '上野': '1310600700700001',
    '池袋': '1311601700100028',
    '六本木': '1310302900600001',
    '恵比寿': '1311300600100005',
    '横浜': '1410301600200000',
    // 港区の主要駅（station_idは要確認）
    // '表参道': 'XXXXX',
    // '銀座': 'XXXXX',
  }
  
  const stationId = stationIdMapping[stationName]
  if (!stationId) {
    console.warn(`station_idが見つかりません: ${stationName}`)
    // フォールバック: 検索フォームを使用
    return `${baseUrl}/search/?station=${encodeURIComponent(stationName)}`
  }
  
  return `${baseUrl}/search/kodawari/list?station_id=${stationId}`
}

/**
 * 住所からエリア名を推定
 */
function estimateAreaFromAddress(address: string, station?: string): string {
  // 駅名からエリアを推定
  if (station) {
    if (station.includes('東新宿')) return '新大久保'
    if (station.includes('新宿')) return '新宿'
    if (station.includes('上野')) return '上野'
    if (station.includes('池袋')) return '池袋'
    if (station.includes('渋谷')) return '渋谷'
    if (station.includes('六本木') || station.includes('恵比寿')) return '港区'
    if (station.includes('横浜')) return '横浜'
  }

  const areaKeywords: { [key: string]: string } = {
    渋谷: '渋谷',
    新宿: '新宿',
    歌舞伎町: '新宿', // 歌舞伎町は新宿区なので新宿エリア
    新大久保: '新大久保',
    上野: '上野',
    池袋: '池袋',
    豊島区: '池袋',
    港区: '港区',
    六本木: '港区',
    恵比寿: '港区',
    横浜: '横浜',
  }

  // 優先順位: より具体的なキーワードを先にチェック
  if (address.includes('横浜') || address.includes('神奈川県')) {
    return '横浜'
  }
  if (address.includes('豊島区') || address.includes('池袋')) {
    return '池袋'
  }
  if (address.includes('上野') || address.includes('台東区') || address.includes('鶯谷')) {
    return '上野'
  }
  if (address.includes('新大久保')) {
    return '新大久保'
  }
  if (address.includes('新宿') || address.includes('歌舞伎町')) {
    return '新宿'
  }
  if (address.includes('港区') || address.includes('六本木') || address.includes('恵比寿')) {
    return '港区'
  }
  if (address.includes('渋谷')) {
    return '渋谷'
  }
  
  return station || '渋谷' // デフォルト
}

/**
 * 住所から緯度・経度を取得（Geocoding API）
 * TODO: Google Geocoding APIを統合
 */
async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
} | null> {
  // TODO: Google Geocoding APIを使用
  console.warn(`Geocoding not implemented: ${address}`)
  return null
}

/**
 * ハッピーホテルサイトからラブホテル情報をスクレイピング（1ページ目のみ）
 */
async function scrapeLoveHotelsByStation(station: string): Promise<LoveHotel[]> {
  const stationName = station.replace('駅', '') // 「駅」を削除（「新宿駅」→「新宿」）
  console.log(`\n🔍 ${stationName}駅周辺のラブホテル情報を取得中...`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const url = getStationSearchUrl(stationName)
    console.log(`  📍 アクセス: ${url}`)
    console.log(`  📋 駅名: ${stationName}`)

    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000) // ページ読み込み待機（Ajax読み込みがある可能性があるため長めに）

    const hotels: LoveHotel[] = []

    // 1ページ目のみ取得
    console.log(`  📄 ページ 1 を取得中...`)

    // ページのHTMLを取得（少し待機してから）
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const html = await page.content()
    const $ = cheerio.load(html)

    // ホテル情報を取得
    // スクリーンショットから: ul.common-hotelList > li.member_vacant.hotel_spc 構造（駅検索の場合）
    // エリア検索の場合: .hotel_std, .hotel_light 構造
    // 両方のパターンに対応
    $('ul.common-hotelList > li, .hotel_std, .hotel_light').each((index, element) => {
      const $el = $(element)
      
      // ホテル名を取得（スクリーンショットから: h3.common-hotelList_name a.common-hotelList_name__text）
      let name = $el.find('h3.common-hotelList_name a.common-hotelList_name__text').text().trim()
      
      // 別のパターンも試す
      if (!name) {
        name = $el.find('h3.common-hotelList_name').text().trim()
      }
      
      // 住所を取得
      // スクリーンショットからは住所の正確なセレクターが確認できないため、複数のパターンを試す
      let address = $el.find('p.common-hotelList_address a span.txt').first().text().trim()
      
      // 別のパターンも試す
      if (!address) {
        address = $el.find('p.common-hotelList_address a').first().text().trim()
      }
      
      // さらに別のパターン（住所が含まれる可能性のある要素を探す）
      if (!address) {
        // 住所パターンを含むテキストを探す
        const text = $el.text()
        const addressMatch = text.match(/東京都[^\s]+[0-9-]+/)
        address = addressMatch ? addressMatch[0] : ''
      }
      
      // 詳細ページのURLを取得
      let detailUrl = $el.find('h3.common-hotelList_name a.common-hotelList_name__text').attr('href')
      
      // 別のパターンも試す
      if (!detailUrl) {
        detailUrl = $el.find('h3.common-hotelList_name a').attr('href')
      }
      
      if (name && address) {
        // 重複チェック（既に追加されているホテル名と比較）
        const isDuplicate = hotels.some(h => h.name === name && h.address === address)
        
        if (!isDuplicate) {
          hotels.push({
            name,
            address,
            latitude: null,
            longitude: null,
            area: estimateAreaFromAddress(address, stationName),
            url: detailUrl ? `https://happyhotel.jp${detailUrl}` : undefined,
          })
        }
      }
    })

    const hotelCount1 = $('ul.common-hotelList > li').length
    const hotelCount2 = $('.hotel_std, .hotel_light').length
    const totalDetected = hotelCount1 + hotelCount2
    console.log(`    ✅ ページ 1: ${totalDetected}件のホテル要素を検出 (ul.common-hotelList > li: ${hotelCount1}件, .hotel_std/.hotel_light: ${hotelCount2}件)`)
    console.log(`  ✅ 合計 ${hotels.length}件のホテル情報を取得しました`)

    return hotels
  } catch (error) {
    console.error(`  ❌ エラーが発生しました:`, error)
    return []
  } finally {
    await browser.close()
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🌱 ハッピーホテルサイトからラブホテル情報をスクレイピング開始...')

  // 対象駅（駅名で検索）
  // エリア検索ではなく、駅検索に統一
  const stations = [
    '渋谷駅',
    '新宿駅',
    '東新宿駅',
    '上野駅',
    '池袋駅',
    '六本木駅',
    '恵比寿駅',
    '横浜駅',
    // 港区の主要駅（station_idが分かれば追加）
    // '表参道駅',
    // '銀座駅',
  ]
  
  console.log(`📋 対象駅: ${stations.join('、')}`)
  console.log(`   (エリア検索ではなく、駅検索で統一)`)

  const allHotels: LoveHotel[] = []

  // 各駅を順番にスクレイピング
  for (const station of stations) {
    const hotels = await scrapeLoveHotelsByStation(station)
    allHotels.push(...hotels)

    // 次の駅に進む前に少し待機
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log(`\n📊 合計 ${allHotels.length}件のホテル情報を取得しました`)

  // 緯度・経度を取得（Geocoding APIが実装されていない場合はスキップ）
  if (process.env.GOOGLE_MAPS_API_KEY) {
    console.log('\n📍 住所から緯度・経度を取得中...')
    for (const hotel of allHotels) {
      if (!hotel.latitude || !hotel.longitude) {
        const location = await geocodeAddress(hotel.address)
        if (location) {
          hotel.latitude = location.latitude
          hotel.longitude = location.longitude
        }
        // APIレート制限を避けるため、少し待機
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  } else {
    console.log('\n⚠️  Google Maps APIキーが設定されていないため、緯度・経度の取得をスキップします')
  }

  // 結果をJSONファイルに保存
  const fs = await import('fs/promises')
  await fs.writeFile(
    'scripts/love-hotels.json',
    JSON.stringify(allHotels, null, 2),
    'utf-8'
  )

  console.log(`\n✅ 結果を scripts/love-hotels.json に保存しました`)
  console.log(`\n📝 次のステップ:`)
  console.log(`   1. scripts/love-hotels.json を確認`)
  console.log(`   2. 必要に応じて手動で修正`)
  console.log(`   3. scripts/collect-shisha-bars-near-love-hotels.ts を実行してシーシャバーを検索`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
