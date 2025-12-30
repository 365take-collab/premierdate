import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

/**
 * 食べログのレビューページのHTML構造を確認
 */
async function testTabelogReviewScraping() {
  console.log('🧪 食べログのレビューページのHTML構造を確認します...')

  const browser = await chromium.launch({ headless: false }) // デバッグ用にheadless: false
  const page = await browser.newPage()

  try {
    // サンプルレビューページにアクセス
    const reviewUrl = 'https://tabelog.com/tokyo/A1304/A130401/13296132/dtlrvwlst/'
    console.log(`📖 レビューページにアクセス: ${reviewUrl}`)
    
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000)

    const html = await page.content()
    const $ = cheerio.load(html)

    console.log('\n📋 HTML構造の確認:')
    console.log('=' .repeat(80))

    // レビュー関連の要素を探す
    const possibleSelectors = [
      '.rvw-item',
      '.rvw-item__rvw-comment',
      '.rvw-item__comment',
      '.rvw-item__rvw-txt',
      '.rvw-item__txt',
      '[class*="rvw-item"]',
      '[class*="review"]',
      '[id*="review"]',
    ]

    console.log('\n🔍 レビュー要素の検索:')
    for (const selector of possibleSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`\n✅ セレクター "${selector}": ${elements.length}件見つかりました`)
        elements.slice(0, 5).each((idx, element) => {
          const text = $(element).text().trim()
          if (text.length > 20 && text.length < 1000) {
            console.log(`  [${idx + 1}] (${text.length}文字) ${text.substring(0, 150)}...`)
            // HTML構造も表示
            const html = $(element).html()?.substring(0, 200)
            if (html) {
              console.log(`      HTML: ${html}...`)
            }
          }
        })
      }
    }

    // 評価（星）の要素を探す
    console.log('\n🔍 評価（星）要素の検索:')
    const ratingSelectors = [
      '.c-rating',
      '.c-rating__val',
      '.rating',
      '[class*="rating"]',
      '[class*="star"]',
    ]
    
    for (const selector of ratingSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`\n✅ セレクター "${selector}": ${elements.length}件見つかりました`)
        elements.slice(0, 3).each((idx, element) => {
          const text = $(element).text().trim()
          const html = $(element).html()?.substring(0, 200)
          console.log(`  [${idx + 1}] テキスト: ${text}, HTML: ${html}...`)
        })
      }
    }

    // デート関連キーワードを含むレビューを探す
    console.log('\n🔍 デート関連キーワードを含むレビュー:')
    const bodyText = $('body').text()
    const dateKeywords = ['デート', '恋人', 'カップル', '記念日', 'ロマンチック', '雰囲気']
    for (const keyword of dateKeywords) {
      if (bodyText.includes(keyword)) {
        const context = bodyText.substring(
          Math.max(0, bodyText.indexOf(keyword) - 100),
          Math.min(bodyText.length, bodyText.indexOf(keyword) + 300)
        )
        console.log(`\n  ✅ "${keyword}" が見つかりました:`)
        console.log(`     ${context}...`)
      }
    }

    // スクリーンショットを保存（デバッグ用）
    await page.screenshot({ path: 'scripts/tabelog-review-page.png', fullPage: true })
    console.log('\n📸 スクリーンショットを保存: scripts/tabelog-review-page.png')

    // HTMLを保存（デバッグ用）
    const fs = require('fs')
    fs.writeFileSync('scripts/tabelog-review-page.html', html, 'utf-8')
    console.log('📄 HTMLを保存: scripts/tabelog-review-page.html')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await browser.close()
  }
}

testTabelogReviewScraping()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
