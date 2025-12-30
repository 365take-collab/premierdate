import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function testReviewExtraction() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  })
  
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    viewport: { width: 1920, height: 1080 },
  })
  
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })
  })
  
  const page = await context.newPage()
  
  const reviewUrl = 'https://tabelog.com/tokyo/A1301/A130101/13251084/dtlrvwlst/'
  
  console.log(`🔗 レビューページに移動: ${reviewUrl}`)
  await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)
  
  console.log(`📍 現在のURL: ${page.url()}`)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  const reviewItems = $('.rvw-item').toArray()
  console.log(`\n📊 レビュー要素数: ${reviewItems.length}件`)
  
  const dateKeywords = ['デート', 'カップル', '記念日', '誕生日', '雰囲気', 'ロマンチック', '二人', '恋人', '彼女', '彼氏', '夜景', '個室', 'プロポーズ', '特別な日']
  
  let dateRelatedCount = 0
  
  reviewItems.slice(0, 10).forEach((item, idx) => {
    const $item = $(item)
    const reviewText = $item.find('.rvw-item__rvw-comment, .rvw-item__comment, .rvw-item__rvw-txt').text().trim()
    const rating = $item.find('.c-rating-v3__val, .rvw-item__ratings--val').first().text().trim()
    
    const isDateRelated = dateKeywords.some(k => reviewText.includes(k))
    
    if (reviewText && reviewText.length > 30) {
      console.log(`\n[${idx + 1}] 評価: ${rating || '不明'} | デート関連: ${isDateRelated ? '✅' : '❌'}`)
      console.log(`テキスト: ${reviewText.substring(0, 80)}...`)
      
      if (isDateRelated) dateRelatedCount++
    }
  })
  
  console.log(`\n📊 デート関連レビュー: ${dateRelatedCount}件`)
  
  console.log(`\n⏰ 10秒待機 - レビューページを確認してください`)
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`\r残り ${i}秒...`)
    await page.waitForTimeout(1000)
  }
  
  console.log(`\n\n✅ テスト完了`)
  await browser.close()
}

testReviewExtraction().catch(console.error)
