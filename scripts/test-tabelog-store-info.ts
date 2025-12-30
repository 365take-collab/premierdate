import 'dotenv/config'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

async function main() {
  const url = process.argv[2]
  if (!url) throw new Error('usage: npx tsx scripts/test-tabelog-store-info.ts <tabelog_store_url>')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    extraHTTPHeaders: {
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })
  const page = await context.newPage()

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)

  const html = await page.content()
  const $ = cheerio.load(html)

  const title = $('title').text().trim()

  const selectors = [
    '.rstinfo-table__name-wrap .display-name span',
    '.display-name span',
    'h2.display-name span',
    '#rst-name',
    'h1',
  ]

  let name = ''
  for (const s of selectors) {
    const t = $(s).first().text().trim()
    if (t) {
      name = t
      break
    }
  }

  const addressSelectors = [
    '.rstinfo-table__address',
    '.rstinfo-table__address p',
    '.rstinfo-table__address span',
    'p.rstinfo-table__address',
    'p[class*="address"]',
  ]

  let address = ''
  for (const s of addressSelectors) {
    const t = $(s).first().text().replace(/\s+/g, ' ').trim()
    if (t) {
      address = t
      break
    }
  }

  console.log({ url, title, name, address })

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
