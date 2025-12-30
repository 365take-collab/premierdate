import 'dotenv/config'
import { chromium } from 'playwright'

async function testGoogleSearch() {
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
  const googleQuery = `${restaurantName} ${area} 食べログ`
  const googleSearchUrl = `https://www.google.com/search?hl=ja&gl=jp&pws=0&num=10&q=${encodeURIComponent(googleQuery)}`
  
  console.log(`🔍 Google検索URL: ${googleSearchUrl}`)
  console.log(`🔍 検索クエリ: ${googleQuery}`)
  
  await page.goto(googleSearchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  
  // Google同意画面が出たら同意する
  try {
    const consentButton = page.locator('#L2AGLb')
    if (await consentButton.count()) {
      console.log('✅ Google同意画面をクリック')
      await consentButton.first().click({ timeout: 3000 })
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      await page.waitForTimeout(1500)
    }
  } catch {
    console.log('ℹ️  同意画面なし（または既に同意済み）')
  }
  
  console.log('\n📸 【15秒待機します - この間にスクリーンショットを撮ってください】')
  console.log('   - Google検索結果ページ全体')
  console.log('   - 開発者ツールで食べログへのリンク要素を検証した画面')
  console.log('   - 特に <a> タグのhref属性を確認してください')
  console.log('')
  
  // 15秒待機
  for (let i = 15; i > 0; i--) {
    process.stdout.write(`\r⏰ 残り ${i}秒...`)
    await page.waitForTimeout(1000)
  }
  
  console.log('\n\n✅ 待機終了')
  
  await browser.close()
}

testGoogleSearch().catch(console.error)
