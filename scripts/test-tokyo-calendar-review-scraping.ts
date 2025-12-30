import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

/**
 * 東京カレンダー（グルカレ）のレビューページのHTML構造を確認
 */
async function testTokyoCalendarReviewScraping() {
  console.log('🧪 東京カレンダー（グルカレ）のレビューページのHTML構造を確認します...')

  const browser = await chromium.launch({ headless: false }) // デバッグ用にheadless: false
  const page = await browser.newPage()

  try {
    // サンプルレビューページにアクセス
    const reviewUrl = 'https://gourmet-calendar.com/reviews/549'
    console.log(`📖 レビューページにアクセス: ${reviewUrl}`)
    
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000) // JavaScriptで動的に読み込まれるコンテンツを待つ

    const html = await page.content()
    const $ = cheerio.load(html)
    
    // ページのテキストコンテンツを確認
    console.log('\n📄 ページの主要なテキストコンテンツ:')
    const mainContent = $('#main_content, main, .content, [class*="content"]').first()
    if (mainContent.length > 0) {
      const text = mainContent.text().trim().substring(0, 500)
      console.log(text)
    }

    console.log('\n📋 HTML構造の確認:')
    console.log('=' .repeat(80))

    // レビュー関連の要素を探す
    const possibleSelectors = [
      '.review',
      '.review-item',
      '.comment',
      '.review-text',
      '.review-content',
      '[class*="review"]',
      '[class*="comment"]',
      '[id*="review"]',
      '[id*="comment"]',
    ]

    console.log('\n🔍 レビュー要素の検索:')
    for (const selector of possibleSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`\n✅ セレクター "${selector}": ${elements.length}件見つかりました`)
        elements.slice(0, 3).each((idx, element) => {
          const text = $(element).text().trim().substring(0, 100)
          console.log(`  [${idx + 1}] ${text}...`)
        })
      }
    }

    // ページ全体の構造を確認
    console.log('\n📋 ページ全体の構造:')
    console.log(`  <body> のクラス: ${$('body').attr('class')}`)
    console.log(`  <body> のID: ${$('body').attr('id')}`)

    // メインコンテンツエリアを探す
    const mainContentSelectors = [
      'main',
      '.main',
      '.content',
      '.container',
      '[class*="main"]',
      '[class*="content"]',
    ]

    console.log('\n🔍 メインコンテンツエリアの検索:')
    for (const selector of mainContentSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`  ✅ "${selector}": ${elements.length}件`)
      }
    }

    // テキストコンテンツからデート関連のキーワードを探す
    console.log('\n🔍 デート関連キーワードの検索:')
    const bodyText = $('body').text()
    const dateKeywords = ['デート', '恋人', 'カップル', '記念日', 'ロマンチック', '雰囲気']
    for (const keyword of dateKeywords) {
      if (bodyText.includes(keyword)) {
        const context = bodyText.substring(
          Math.max(0, bodyText.indexOf(keyword) - 50),
          Math.min(bodyText.length, bodyText.indexOf(keyword) + 200)
        )
        console.log(`  ✅ "${keyword}" が見つかりました:`)
        console.log(`     ${context}...`)
      }
    }

    // スクリーンショットを保存（デバッグ用）
    await page.screenshot({ path: 'scripts/tokyo-calendar-review-page.png', fullPage: true })
    console.log('\n📸 スクリーンショットを保存: scripts/tokyo-calendar-review-page.png')

    // HTMLを保存（デバッグ用）
    const fs = require('fs')
    fs.writeFileSync('scripts/tokyo-calendar-review-page.html', html, 'utf-8')
    console.log('📄 HTMLを保存: scripts/tokyo-calendar-review-page.html')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
  }
}

testTokyoCalendarReviewScraping()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
