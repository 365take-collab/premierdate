import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { readFileSync, writeFileSync } from 'fs'

/**
 * テスト用: 少数のレストランの詳細ページから住所・緯度・経度を取得
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

async function testScrapeDetails() {
  console.log('🧪 テスト: 詳細ページから住所・緯度・経度を取得')

  // JSONファイルを読み込む
  const jsonData = readFileSync('scripts/tokyo-calendar-restaurants.json', 'utf-8')
  const restaurants: TokyoCalendarRestaurant[] = JSON.parse(jsonData)

  // 最初の5件だけテスト
  const testRestaurants = restaurants.slice(0, 5)
  console.log(`📊 テスト対象: ${testRestaurants.length}件`)

  const browser = await chromium.launch({ headless: false }) // デバッグ用にheadless: false
  const page = await browser.newPage()

  for (let i = 0; i < testRestaurants.length; i++) {
    const restaurant = testRestaurants[i]
    if (!restaurant.url) {
      console.log(`\n⚠️  ${restaurant.name}: URLがありません`)
      continue
    }

    try {
      console.log(`\n[${i + 1}/${testRestaurants.length}] ${restaurant.name}`)
      console.log(`  URL: ${restaurant.url}`)

      // 詳細ページにアクセス
      await page.goto(restaurant.url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000) // コンテンツが読み込まれるまで待機

      const detailHtml = await page.content()
      const $detail = cheerio.load(detailHtml)

      // HTML構造を確認するために、主要な要素を表示
      console.log('\n  📋 HTML構造の確認:')
      
      // 住所を取得（複数のセレクターを試す）
      let address = ''
      const addressSelectors = [
        '.restaurant-address',
        '.address',
        '[data-address]',
        '.restaurant-info .address',
        '.restaurant-detail .address',
        '.restaurant-info',
        '.restaurant-detail',
        '[class*="address"]',
        '[class*="住所"]',
      ]

      console.log('  🔍 住所セレクターの確認:')
      for (const selector of addressSelectors) {
        const elements = $detail(selector)
        if (elements.length > 0) {
          const text = elements.first().text().trim()
          console.log(`    - ${selector}: ${text.substring(0, 50)}`)
          if (!address && text && text.length > 0) {
            address = text
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
          console.log(`    - テキスト検索で発見: ${address}`)
        }
      }

      // 緯度・経度を取得
      let latitude: number | null = null
      let longitude: number | null = null

      console.log('\n  🔍 緯度・経度の確認:')
      
      // data属性から取得を試す
      const latAttr = $detail('[data-latitude]').first().attr('data-latitude')
      const lngAttr = $detail('[data-longitude]').first().attr('data-longitude')
      
      if (latAttr && lngAttr) {
        latitude = parseFloat(latAttr)
        longitude = parseFloat(lngAttr)
        console.log(`    - data属性から取得: ${latitude}, ${longitude}`)
      } else {
        // scriptタグから取得を試す
        const scripts = $detail('script').toArray()
        console.log(`    - scriptタグ数: ${scripts.length}`)
        
        for (let j = 0; j < Math.min(scripts.length, 5); j++) {
          const script = scripts[j]
          const scriptContent = $detail(script).html() || ''
          
          // 緯度・経度のパターンを探す
          const latMatch = scriptContent.match(/lat(itude)?["\s:=]+([0-9.]+)/i)
          const lngMatch = scriptContent.match(/lng|lon(gitude)?["\s:=]+([0-9.]+)/i)
          
          if (latMatch && lngMatch) {
            latitude = parseFloat(latMatch[2] || latMatch[1])
            longitude = parseFloat(lngMatch[2] || lngMatch[1])
            console.log(`    - scriptタグから取得: ${latitude}, ${longitude}`)
            break
          }

          // 配列形式 [緯度, 経度] を探す
          const coordMatch = scriptContent.match(/\[([0-9.]+),\s*([0-9.]+)\]/)
          if (coordMatch) {
            latitude = parseFloat(coordMatch[1])
            longitude = parseFloat(coordMatch[2])
            console.log(`    - 配列形式から取得: ${latitude}, ${longitude}`)
            break
          }
        }
      }

      // 結果を表示
      console.log('\n  ✅ 取得結果:')
      console.log(`    - 住所: ${address || '未取得'}`)
      console.log(`    - 緯度: ${latitude || '未取得'}`)
      console.log(`    - 経度: ${longitude || '未取得'}`)

      // データを更新
      if (address && address.length > 0) {
        restaurant.address = address
      }
      if (latitude !== null && longitude !== null) {
        restaurant.latitude = latitude
        restaurant.longitude = longitude
      }

      // サーバー負荷を軽減するため、少し待機
      await page.waitForTimeout(2000)

    } catch (error) {
      console.error(`  ❌ エラー: ${restaurant.name}`, error)
    }
  }

  await browser.close()

  // 結果を保存
  const resultPath = 'scripts/test-scrape-details-result.json'
  writeFileSync(resultPath, JSON.stringify(testRestaurants, null, 2), 'utf-8')
  console.log(`\n📁 結果を保存しました: ${resultPath}`)
}

testScrapeDetails()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
