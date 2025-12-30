import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function testTabelogSearch() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  const searchQuery = '鮨 一心'
  const searchUrl = `https://tabelog.com/tokyo/rstLst/?sk=${encodeURIComponent(searchQuery)}`
  
  console.log(`検索URL: ${searchUrl}`)
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  console.log('\n検索結果:')
  $('.list-rst').each((idx, element) => {
    const name = $(element).find('.list-rst__rst-name-target').text().trim()
    const area = $(element).find('.list-rst__area-text').text().trim()
    const url = $(element).find('.list-rst__rst-name-target').attr('href')
    
    if (name) {
      console.log(`${idx + 1}. ${name} (${area}) - ${url}`)
    }
  })
  
  await page.screenshot({ path: 'scripts/tabelog-search-result.png', fullPage: true })
  console.log('\nスクリーンショットを保存: scripts/tabelog-search-result.png')
  
  await browser.close()
}

testTabelogSearch().catch(console.error)
