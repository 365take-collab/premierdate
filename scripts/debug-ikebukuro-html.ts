import 'dotenv/config'
import { chromium } from 'playwright'
import { writeFile } from 'fs/promises'

/**
 * 池袋エリアのHTML構造を確認するデバッグスクリプト
 */

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // magazine=trueあり
    const url1 = 'https://gourmet-calendar.com/restaurants/search_map?place_codes[]=15&magazine=true&sort=new'
    console.log(`🔍 ${url1} にアクセス中...`)
    
    await page.goto(url1, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    const html1 = await page.content()
    await writeFile('scripts/ikebukuro-with-magazine.html', html1, 'utf-8')
    console.log('✅ HTMLを保存しました: scripts/ikebukuro-with-magazine.html')

    const count1 = await page.locator('.large-restaurant-wrap').count()
    console.log(`📊 magazine=trueの場合のレストラン数: ${count1}件`)

    // magazine=trueなし
    const url2 = 'https://gourmet-calendar.com/restaurants/search_map?place_codes[]=15&sort=new'
    console.log(`\n🔍 ${url2} にアクセス中...`)
    
    await page.goto(url2, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    const html2 = await page.content()
    await writeFile('scripts/ikebukuro-without-magazine.html', html2, 'utf-8')
    console.log('✅ HTMLを保存しました: scripts/ikebukuro-without-magazine.html')

    const count2 = await page.locator('.large-restaurant-wrap').count()
    console.log(`📊 magazine=trueなしの場合のレストラン数: ${count2}件`)

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
