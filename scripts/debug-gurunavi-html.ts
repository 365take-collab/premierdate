import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function main() {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  })
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  })
  
  const page = await context.newPage()
  
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  try {
    const gurunaviUrl = 'https://r.gnavi.co.jp/68gh07ju0000/review/'
    console.log(`📖 グルナビレビューページにアクセス: ${gurunaviUrl}`)
    await page.goto(gurunaviUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000)
    
    const html = await page.content()
    const $ = cheerio.load(html)
    
    // レビューに関連する要素を探す
    console.log('\n=== レビュー関連の要素を検索 ===\n')
    
    // 様々なパターンで検索
    const patterns = [
      'ul.review',
      'ul[class*="review"]',
      'ol.review',
      'ol[class*="review"]',
      '.review-list',
      '[class*="review-list"]',
      '.review-item',
      '[class*="review-item"]',
      '.comment',
      '[class*="comment"]',
      'article',
      'section',
      'li[class*="review"]',
      'div[class*="review"]'
    ]
    
    for (const pattern of patterns) {
      const elements = $(pattern)
      if (elements.length > 0) {
        console.log(`\n✅ パターン: ${pattern} - ${elements.length}件見つかりました`)
        elements.each((idx, el) => {
          const $el = $(el)
          const text = $el.text().trim().substring(0, 200)
          const classes = $el.attr('class') || ''
          const id = $el.attr('id') || ''
          console.log(`  要素[${idx}]: クラス="${classes.substring(0, 100)}", ID="${id}", テキスト="${text}"`)
          if (idx < 3 && text.length > 50) {
            console.log(`    HTML: ${$el.html()?.substring(0, 300)}`)
          }
        })
      }
    }
    
    // HTML全体を保存（デバッグ用）
    console.log('\n=== HTMLの一部を表示 ===\n')
    const bodyText = $('body').text().substring(0, 2000)
    console.log(bodyText)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    // ブラウザは開いたままにして手動で確認できるようにする
    console.log('\n⏸️  ブラウザは開いたままです。確認後に手動で閉じてください。')
    await new Promise(resolve => setTimeout(resolve, 30000)) // 30秒待機
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
