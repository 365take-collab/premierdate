import { chromium } from 'playwright'

/**
 * ハッピーホテルサイトのHTML構造を確認するデバッグスクリプト
 */

async function main() {
  console.log('🔍 ハッピーホテルサイトのHTML構造を確認中...\n')

  const browser = await chromium.launch({ headless: false }) // headless: false でブラウザを表示
  const page = await browser.newPage()

  try {
    // 渋谷エリアの検索結果ページにアクセス
    // 実際のURL構造を確認するために、まずトップページから始める
    console.log('📍 ハッピーホテルサイトにアクセス中...')
    await page.goto('https://happyhotel.jp/', { waitUntil: 'networkidle' })
    
    // ページのタイトルを確認
    const title = await page.title()
    console.log(`ページタイトル: ${title}\n`)

    // ページのHTML全体を取得して表示（最初の5000文字）
    const html = await page.content()
    console.log('📄 HTML構造（最初の5000文字）:')
    console.log('='.repeat(80))
    console.log(html.substring(0, 5000))
    console.log('='.repeat(80))
    console.log('\n')

    // 一般的なセレクターを試して、どの要素が存在するか確認
    console.log('🔎 一般的なセレクターをテスト中...\n')

    const selectors = [
      '.hotel-list',
      '.hotel-item',
      '.hotel',
      '[class*="hotel"]',
      '[class*="list"]',
      'article',
      '.card',
      '.item',
      '[data-hotel]',
      'h2',
      'h3',
    ]

    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector)
        if (elements.length > 0) {
          console.log(`✅ "${selector}": ${elements.length}件見つかりました`)
          
          // 最初の要素のHTMLを表示
          if (elements.length > 0) {
            const firstElement = await elements[0].innerHTML()
            console.log(`   最初の要素（最初の300文字）:`)
            console.log(`   ${firstElement.substring(0, 300)}...`)
            console.log('')
          }
        }
      } catch (e) {
        // セレクターエラーは無視
      }
    }

    // ページのスクリーンショットを保存
    await page.screenshot({ path: 'scripts/screenshot-happyhotel.png', fullPage: true })
    console.log('📸 スクリーンショットを保存しました: scripts/screenshot-happyhotel.png\n')

    // すべてのリンクを確認
    console.log('🔗 ページ内のリンクを確認中...\n')
    const links = await page.$$eval('a', (elements) =>
      elements.map((el) => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
      }))
    )

    // ホテル関連のリンクを表示
    const hotelLinks = links.filter(
      (link) =>
        link.href?.includes('hotel') ||
        link.href?.includes('detail') ||
        link.text?.includes('ホテル')
    )

    console.log(`ホテル関連のリンク（最初の10件）:`)
    hotelLinks.slice(0, 10).forEach((link) => {
      console.log(`  - ${link.text}: ${link.href}`)
    })

    console.log('\n⏸️  ブラウザを開いています。確認が終わったら、Enterキーを押してください...')
    
    // ブラウザを開いたままにする（手動で確認できるように）
    await page.waitForTimeout(60000) // 60秒待機

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



