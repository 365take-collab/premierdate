import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function testReviewScraping(url: string) {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  console.log(`レビューページに移動: ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  let reviewCount = 0
  let dateRelatedCount = 0
  
  $('.rvw-item').each((idx, itemElement) => {
    reviewCount++
    const $item = $(itemElement)
    
    const reviewText = $item.find('.rvw-item__rvw-comment, .rvw-item__comment, .rvw-item__rvw-txt').text().trim()
    const rating = $item.find('.c-rating-v3__val, .rvw-item__ratings--val').first().text().trim()
    
    // デート関連キーワード
    const dateKeywords = ['デート', 'カップル', '記念日', '誕生日', '雰囲気', 'ロマンチック', '二人', '恋人', '彼女', '彼氏', '夜景', '個室', 'プロポーズ', '特別な日']
    const isDateRelated = dateKeywords.some(k => reviewText.includes(k))
    
    if (isDateRelated) {
      dateRelatedCount++
      if (dateRelatedCount <= 3) {
        console.log(`\n[${idx + 1}] 評価: ${rating}`)
        console.log(`テキスト: ${reviewText.substring(0, 100)}...`)
      }
    }
  })
  
  console.log(`\n📊 全レビュー数: ${reviewCount}件`)
  console.log(`📊 デート関連レビュー数: ${dateRelatedCount}件`)
  
  await browser.close()
}

const url = process.argv[2] || 'https://tabelog.com/tokyo/A1304/A130401/13288884/dtlrvwlst/'
testReviewScraping(url).catch(console.error)
