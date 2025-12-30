import 'dotenv/config'
import { chromium } from 'playwright'

async function testFullFlow() {
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
  
  console.log(`\n【ステップ1】Google検索`)
  console.log(`🔍 検索クエリ: ${googleQuery}`)
  
  await page.goto(googleSearchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  
  // Google同意画面
  try {
    const consentButton = page.locator('#L2AGLb')
    if (await consentButton.count()) {
      await consentButton.first().click({ timeout: 3000 })
      await page.waitForTimeout(1500)
    }
  } catch {}
  
  console.log(`✅ Google検索結果ページを開きました`)
  console.log(`⏰ 5秒待機...`)
  await page.waitForTimeout(5000)
  
  // URLを抽出
  console.log(`\n【ステップ2】食べログURLを抽出`)
  const rawHrefs = await page.$$eval('a', (anchors) =>
    anchors
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => href.length > 0 && href.includes('tabelog.com')),
  )
  
  console.log(`🔍 食べログURLの候補: ${rawHrefs.length}件`)
  
  let tabelogUrl: string | null = null
  for (const href of rawHrefs.slice(0, 5)) {
    console.log(`  - ${href}`)
    
    if (href.startsWith('http') && href.includes('tabelog.com')) {
      const match = href.match(/(https?:\/\/(?:s\.)?tabelog\.com\/tokyo\/A\d+\/A\d+\/\d+\/?)/)
      if (match) {
        tabelogUrl = match[1].replace(/\/?$/, '/').replace('s.tabelog.com', 'tabelog.com')
        console.log(`✅ 食べログURLを発見: ${tabelogUrl}`)
        break
      }
    }
  }
  
  if (!tabelogUrl) {
    console.log(`❌ 食べログURLが見つかりませんでした`)
    await browser.close()
    return
  }
  
  console.log(`\n【ステップ3】食べログ店舗ページに移動`)
  console.log(`🔗 URL: ${tabelogUrl}`)
  
  await page.goto(tabelogUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3000)
  
  console.log(`✅ 食べログ店舗ページを開きました`)
  console.log(`📍 現在のURL: ${page.url()}`)
  
  console.log(`\n【ステップ4】レビューページに移動`)
  const reviewUrl = tabelogUrl.replace(/\/$/, '') + '/dtlrvwlst/'
  console.log(`🔗 レビューURL: ${reviewUrl}`)
  
  await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3000)
  
  console.log(`✅ レビューページを開きました`)
  console.log(`📍 現在のURL: ${page.url()}`)
  
  console.log(`\n⏰ 10秒待機 - 各ページを確認してください`)
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`\r残り ${i}秒...`)
    await page.waitForTimeout(1000)
  }
  
  console.log(`\n\n✅ テスト完了`)
  await browser.close()
}

testFullFlow().catch(console.error)
