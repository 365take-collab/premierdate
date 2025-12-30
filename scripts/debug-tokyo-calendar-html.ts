import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { writeFile } from 'fs/promises'

/**
 * グルカレ by 東京カレンダーのHTML構造を確認するデバッグスクリプト
 */

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const url = 'https://gourmet-calendar.com/restaurants/search_map?limit=100&magazine=true&sort=new'
    console.log(`🔍 ${url} にアクセス中...`)
    
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000) // コンテンツが読み込まれるまで待機

    // HTMLを取得
    const html = await page.content()
    
    // HTMLをファイルに保存
    await writeFile('scripts/tokyo-calendar-html-debug.html', html, 'utf-8')
    console.log('✅ HTMLを保存しました: scripts/tokyo-calendar-html-debug.html')

    // Cheerioでパース
    const $ = cheerio.load(html)

    // レストラン関連の要素を探す
    console.log('\n📋 HTML構造の分析結果:')
    
    // パターン1: レストランリンク
    const restaurantLinks = $('a[href*="/restaurants/"]').length
    console.log(`  - a[href*="/restaurants/"]: ${restaurantLinks}件`)
    
    // パターン2: カード要素
    const cards = $('.restaurant-card, .card, .item, article, [class*="restaurant"], [class*="shop"]').length
    console.log(`  - .restaurant-card, .card, etc.: ${cards}件`)
    
    // パターン3: リスト要素
    const listItems = $('ul li, ol li, [role="listitem"]').length
    console.log(`  - ul li, ol li: ${listItems}件`)
    
    // 実際のレストラン名を探す
    console.log('\n📋 レストラン名の候補:')
    $('a[href*="/restaurants/"]').slice(0, 10).each((index, element) => {
      const $link = $(element)
      const text = $link.text().trim()
      const href = $link.attr('href')
      if (text && text.length < 50) {
        console.log(`  ${index + 1}. "${text}" (${href})`)
      }
    })

    // クラス名を分析
    console.log('\n📋 よく使われているクラス名（上位20）:')
    const classCounts: { [key: string]: number } = {}
    $('[class]').each((index, element) => {
      const classes = $(element).attr('class')?.split(' ') || []
      classes.forEach(className => {
        if (className && className.length > 0) {
          classCounts[className] = (classCounts[className] || 0) + 1
        }
      })
    })
    
    const sortedClasses = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
    
    sortedClasses.forEach(([className, count]) => {
      if (className.includes('restaurant') || className.includes('shop') || className.includes('card') || className.includes('item')) {
        console.log(`  - .${className}: ${count}件`)
      }
    })

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
  }
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
