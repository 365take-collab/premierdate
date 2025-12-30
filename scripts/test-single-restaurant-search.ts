import 'dotenv/config'
import { chromium } from 'playwright'

async function testSearch() {
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
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  })
  
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })
  })
  
  const page = await context.newPage()
  
  const restaurantName = '鮨屋のうおきん'
  const area = '銀座'
  const searchQuery = encodeURIComponent(`${restaurantName} ${area}`)
  const searchUrl = `https://tabelog.com/tokyo/rstLst/?vs=1&sa=&sk=${searchQuery}`
  
  console.log(`🔍 検索URL: ${searchUrl}`)
  console.log(`🔍 検索中: ${restaurantName} ${area}`)
  
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  
  // 人間らしい動作
  await page.evaluate(() => window.scrollTo(0, 300))
  await page.waitForTimeout(1000)
  
  try {
    await page.waitForSelector('.list-rst', { timeout: 10000 })
  } catch {
    console.log('⚠️  .list-rst セレクターが見つかりません')
  }
  
  console.log('\n📸 【15秒待機します - この間にスクリーンショットを撮ってください】')
  console.log('   - 検索結果ページ全体')
  console.log('   - 開発者ツールで店舗リスト要素を検証した画面')
  console.log('')
  
  // 15秒待機
  for (let i = 15; i > 0; i--) {
    process.stdout.write(`\r⏰ 残り ${i}秒...`)
    await page.waitForTimeout(1000)
  }
  
  console.log('\n\n✅ 待機終了')
  
  await browser.close()
}

testSearch().catch(console.error)
