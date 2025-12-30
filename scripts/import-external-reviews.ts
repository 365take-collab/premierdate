import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env file')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// OpenAI APIクライアント
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} else {
  console.log('⚠️  OPENAI_API_KEYが設定されていません。リライト機能はスキップされます。')
}

// デート関連のキーワード
const DATE_KEYWORDS = [
  'デート',
  'カップル',
  '記念日',
  '誕生日',
  '雰囲気',
  'ロマンチック',
  '二人',
  '恋人',
  '彼女',
  '彼氏',
  '夜景',
  '個室',
  'プロポーズ',
  '特別な日',
]

interface ExternalReview {
  restaurantName: string
  rating: number
  reviewText: string
  source: 'tabelog' | 'tokyo-calendar' | 'gurunavi'
}

// デート関連のレビューかどうかを判定
function isDateRelatedReview(reviewText: string): boolean {
  return DATE_KEYWORDS.some((keyword) => reviewText.includes(keyword))
}

// レビューをリライト
async function rewriteReview(originalText: string, restaurantName: string): Promise<string> {
  if (!openai) {
    return originalText
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはデートガイドのレビューライターです。外部サイトのレビューを、デートガイドに適した形式にリライトしてください。',
        },
        {
          role: 'user',
          content: `以下のレビューを、デートガイドに適した形式にリライトしてください。

店舗名: ${restaurantName}
元のレビュー: ${originalText}

リライトの条件:
- デート向けの視点で書く
- 雰囲気や特別な日に適しているかを強調
- 100-200文字程度にまとめる
- 元のレビューの内容を尊重しつつ、デート向けに最適化する`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return response.choices[0]?.message?.content || originalText
  } catch (error) {
    console.error('  ⚠️  リライトエラー:', error)
    return originalText
  }
}

// 食べログからレビューを取得
async function scrapeTabelogReviews(restaurantName: string, restaurantArea: string, address: string, tabelogUrl?: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []
  const browser = await chromium.launch({
    headless: false, // ヘッドレスモードを無効化してテスト
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // 自動化検出を無効化
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
  
  // navigator.webdriverを隠す
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })
  })
  const page = await context.newPage()

  const normalizeCompact = (s: string) => s.replace(/\s+/g, '').toLowerCase()

  const extractWardCity = (addr: string): string | null => {
    const a = addr.replace(/\s+/g, '')
    const m = a.match(/[^0-9]{1,10}(区|市|町|村)/)
    return m?.[0] ?? null
  }

  const calcAddressMatchScore = (dbAddress: string, tabelogAddress: string, area: string): number => {
    const db = normalizeCompact(dbAddress)
    const tb = normalizeCompact(tabelogAddress)
    const areaN = normalizeCompact(area)

    let score = 0

    const wardCity = extractWardCity(dbAddress)
    if (wardCity && tb.includes(normalizeCompact(wardCity))) {
      score += 70
    }

    if (areaN && tb.includes(areaN)) {
      score += 20
    }

    // 都道府県（東京都など）が一致していれば微加点
    const prefMatch = db.match(/(東京都|神奈川県|埼玉県|千葉県|大阪府|京都府|北海道|福岡県)/)
    if (prefMatch && tb.includes(normalizeCompact(prefMatch[1]))) {
      score += 10
    }

    return score
  }

  const fetchTabelogStoreInfo = async (storeUrl: string): Promise<{ name: string; address: string }> => {
    const p = await context.newPage()
    try {
      await p.goto(storeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await p.waitForTimeout(1500)
      const html = await p.content()
      const $ = cheerio.load(html)

      const name =
        $('.display-name span').first().text().trim() ||
        $('h2.display-name span').first().text().trim() ||
        $('title').text().trim()

      const addr =
        $('.rstinfo-table__address').first().text().replace(/\s+/g, ' ').trim() ||
        $('p.rstinfo-table__address').first().text().replace(/\s+/g, ' ').trim()

      return { name, address: addr }
    } finally {
      await p.close().catch(() => {})
    }
  }

  try {
    // tabelogUrlが指定されている場合は、それを優先的に使用
    let restaurantDetailUrl: string | null = tabelogUrl || null
    
    if (restaurantDetailUrl) {
      console.log(`  ✅ 事前指定された食べログURL使用: ${restaurantDetailUrl}`)
    } else {
      // 店舗名から不要な部分を除去して主要部分のみを抽出
      let coreRestaurantName = restaurantName
        .replace(/\s*(本店|銀座店|渋谷店|新宿店|上野店|池袋店|六本木店|赤坂店|恵比寿店|表参道店|青山店|麻布店|丸の内店|有楽町店)\s*$/g, '')
        .replace(/\s+店\s*$/g, '')
        .trim()

      // まずGoogleで「site:tabelog.com/tokyo」検索して店舗URLを探す
    // （Googleの結果リンクは /url?q=... 形式が多いので、hrefのqパラメータから抽出する）
    let restaurantDetailUrl: string | null = null
    try {
      const googleQueries = Array.from(
        new Set([
          `${restaurantName} ${restaurantArea} 食べログ`,
          `${coreRestaurantName} ${restaurantArea} 食べログ`,
          `${coreRestaurantName} ${restaurantArea} site:tabelog.com/tokyo`,
        ]),
      )

      for (const googleQuery of googleQueries) {
        const googleSearchUrl = `https://www.google.com/search?hl=ja&gl=jp&pws=0&num=10&q=${encodeURIComponent(googleQuery)}`

        console.log(`  🔍 Googleで店舗URL探索: ${googleQuery}`)
        await page.goto(googleSearchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.waitForTimeout(2000)

        // Google同意画面が出たら同意する
        try {
          const consentButton = page.locator('#L2AGLb')
          if (await consentButton.count()) {
            await consentButton.first().click({ timeout: 3000 })
            await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
            await page.waitForTimeout(1500)
          }
        } catch {
          // 同意画面が出ていない/クリックできない場合は無視
        }

        if (process.env.TEST_MODE === 'true') {
          await page.screenshot({ path: `scripts/google-search-debug-${Date.now()}.png`, fullPage: false })
        }

              const rawHrefs = await page.$$eval('a', (anchors) =>
                anchors
                  .map((a) => a.getAttribute('href') ?? '')
                  .filter((href) => href.length > 0),
              )

              if (rawHrefs.length === 0) {
                console.log(`  ⚠️  Google検索: aタグが取得できません（ブロック/検証ページの可能性）`)
                continue
              }

              for (const href of rawHrefs) {
                let candidate: string | null = null
                
                // 直接食べログURL（短縮URLを含む）
                if (href.includes('tabelog.com') && href.startsWith('http')) {
                  candidate = href
                }
                // /url?q=... 形式
                else if (href.startsWith('/url?')) {
                  try {
                    const u = new URL(`https://www.google.com${href}`)
                    candidate = u.searchParams.get('q')
                  } catch {
                    candidate = null
                  }
                }

                if (!candidate) continue
                if (!candidate.includes('tabelog.com')) continue

                // 短縮URL (s.tabelog.com) または通常URL (tabelog.com) の両方に対応
                const match = candidate.match(/(https?:\/\/(?:s\.)?tabelog\.com\/tokyo\/A\d+\/A\d+\/\d+\/?)/)
                if (match) {
                  // 店舗ページを正規化（末尾スラッシュあり、短縮URLは通常URLに変換）
                  let url = match[1].replace(/\/?$/, '/') // 必ず末尾 /
                  // s.tabelog.com を tabelog.com に変換
                  url = url.replace('s.tabelog.com', 'tabelog.com')
                  restaurantDetailUrl = url
                  break
                }
              }

        if (restaurantDetailUrl) break
      }

      // Googleで見つかったURLが本当に同一店舗か、住所で簡易検証
      if (restaurantDetailUrl) {
        try {
          const storeInfo = await fetchTabelogStoreInfo(restaurantDetailUrl)
          const addrScore = calcAddressMatchScore(address, storeInfo.address, restaurantArea)
          console.log(`  🧭 住所検証: ${storeInfo.address} (score: ${addrScore})`)
          if (addrScore < 70) {
            console.log(`  ⚠️  Google結果の店舗住所が一致しないため、このURLは破棄します`)
            restaurantDetailUrl = null
          } else {
            console.log(`  ✅ Googleで食べログ店舗URLを発見: ${restaurantDetailUrl}`)
          }
        } catch (e) {
          console.log(`  ⚠️  Google結果URLの住所検証に失敗: ${e}`)
          restaurantDetailUrl = null
        }
      } else {
        console.log(`  ⚠️  Googleから食べログ店舗URLを取得できませんでした（検索結果に出ない/ブロックの可能性）`)
      }
    } catch (e) {
      console.log(`  ⚠️  Google検索が失敗しました: ${e}`)
    }

    // Googleで取れなかった場合は、食べログ内検索でフォールバック
    if (!restaurantDetailUrl) {
      const searchQuery = encodeURIComponent(`${coreRestaurantName} ${restaurantArea}`)
      const searchUrl = `https://tabelog.com/tokyo/rstLst/?vs=1&sa=&sk=${searchQuery}`

      console.log(`  🔍 食べログで検索: ${coreRestaurantName} ${restaurantArea}`)
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      
      // 人間らしい動作をシミュレート
      await page.waitForTimeout(2000)
      
      // ページをスクロール（人間らしい動作）
      await page.evaluate(() => window.scrollTo(0, 300))
      await page.waitForTimeout(1000)
      
      // 検索結果が動的に読み込まれるのを待つ
      try {
        await page.waitForSelector('.list-rst', { timeout: 10000 })
      } catch {
        // セレクターが見つからない場合も継続
      }
      await page.waitForTimeout(3000) // 検索結果の読み込みを待つ

      // HTMLをcheerioで解析
      const searchHtml = await page.content()
      const $search = cheerio.load(searchHtml)

      const searchResults = $search('.list-rst').toArray()
      console.log(`  🔍 検索結果: ${searchResults.length}件`)

      if (searchResults.length === 0) {
        console.log(`  ⚠️  食べログで店舗が見つかりませんでした`)
        await browser.close()
        return reviews
      }

      // 候補を作り、上位から店舗ページの住所を検証して一致するものだけ採用する
      const candidates: Array<{ name: string; url: string; nameScore: number }> = []

      for (const result of searchResults) {
        const $result = $search(result)
        const resultName = $result.find('.list-rst__rst-name-target').text().trim()
        const url = $result.find('.list-rst__rst-name-target').attr('href')
        if (!resultName || !url) continue

        const normalizedResultName = normalizeCompact(resultName)
        const normalizedRestaurantName = normalizeCompact(restaurantName)
        const normalizedCoreRestaurantName = normalizeCompact(coreRestaurantName)

        let nameScore = 0
        if (normalizedResultName === normalizedRestaurantName) nameScore = 100
        else if (normalizedResultName.includes(normalizedCoreRestaurantName) && normalizedCoreRestaurantName.length > 2) nameScore = 85
        else if (normalizedResultName.includes(normalizedRestaurantName)) nameScore = 80
        else if (normalizedRestaurantName.includes(normalizedResultName)) nameScore = 70
        else {
          const restaurantWords = normalizedCoreRestaurantName.split(/[・]/).filter((w) => w.length > 1)
          const resultWords = normalizedResultName.split(/[・]/).filter((w) => w.length > 1)
          const matchingWords = restaurantWords.filter((word) => resultWords.some((rw) => rw.includes(word) || word.includes(rw)))
          if (restaurantWords.length > 0) nameScore = (matchingWords.length / restaurantWords.length) * 50
        }

        candidates.push({ name: resultName, url, nameScore })
      }

      candidates.sort((a, b) => b.nameScore - a.nameScore)

      for (const c of candidates.slice(0, 5)) {
        const candidateUrl = c.url.startsWith('http') ? c.url : `https://tabelog.com${c.url}`
        try {
          const storeInfo = await fetchTabelogStoreInfo(candidateUrl)
          const addrScore = calcAddressMatchScore(address, storeInfo.address, restaurantArea)
          console.log(`  候補: ${c.name} (nameScore:${c.nameScore.toFixed(0)}) / 住所:${storeInfo.address} (addrScore:${addrScore})`)
          if (addrScore >= 70) {
            restaurantDetailUrl = candidateUrl
            console.log(`  ✅ 住所一致で採用: ${storeInfo.name} -> ${restaurantDetailUrl}`)
            break
          }
        } catch {
          // 次の候補へ
        }
      }

      if (!restaurantDetailUrl) {
        console.log(`  ⚠️  食べログ内検索: 住所一致する店舗が見つかりませんでした（誤マッチ防止のためスキップ）`)
        await browser.close()
        return reviews
      }
    }
    }

    if (!restaurantDetailUrl) {
      console.log(`  ⚠️  食べログで店舗が見つかりませんでした`)
      await browser.close()
      return reviews
    }

    // 店舗詳細ページのURLからレビューページのURLを構築
    const reviewUrl = restaurantDetailUrl.replace(/\/$/, '').replace(/\/dtlrvwlst\/?$/, '') + '/dtlrvwlst/'
    console.log(`  📖 レビューページに移動: ${reviewUrl}`)
    await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000) // レビューが読み込まれるまで待機

    const html = await page.content()
    const $ = cheerio.load(html)

    // 食べログのレビューセクションを取得
    $('.rvw-item').each((_, itemElement) => {
      const $item = $(itemElement)

      // レビューテキストを取得
      const reviewTextElement = $item.find('.rvw-item__rvw-comment, .rvw-item__comment, .rvw-item__rvw-txt')
      let reviewText = reviewTextElement.text().trim()

      // レビュアー情報や余分なテキストを除去
      reviewText = reviewText.replace(/by\s+[^\s]+(?:\s*\(\d+\))?[^\s]*/gi, '')
      reviewText = reviewText.replace(/[^\s]+\(\d+\)/g, '')
      reviewText = reviewText.replace(/(もっと見る|続きを読む)/g, '') // 「もっと見る」「続きを読む」を除去
      reviewText = reviewText.replace(/\s+/g, ' ').trim()

      // レビューテキストの品質チェック
      if (!reviewText || reviewText.length < 30 || reviewText.length > 1000) return

      // 評価を取得（各レビューアイテム内の評価を探す）
      let rating = 4 // デフォルト値

      const ratingSelectors = [
        '.rvw-item__ratings--val',
        '.c-rating-v3__val',
        '.rvw-item__ratings .c-rating-v3__val',
        '.rvw-item__ratings .c-rating__val',
        '.c-rating__val',
        '[class*="rating"] [class*="val"]',
      ]

      for (const selector of ratingSelectors) {
        const ratingElement = $item.find(selector).first()
        if (ratingElement.length > 0) {
          const ratingText = ratingElement.text().trim()
          const ratingMatch = ratingText.match(/([0-9.]+)/)
          if (ratingMatch) {
            const ratingValue = parseFloat(ratingMatch[1])
            rating = Math.round(ratingValue)
            if (rating > 5) rating = 5
            if (rating < 1) rating = 1
            break
          }
        }
      }

      // デート関連のレビューのみを追加
      if (reviewText && isDateRelatedReview(reviewText)) {
        reviews.push({
          restaurantName: restaurantName,
          rating: rating,
          reviewText: reviewText,
          source: 'tabelog',
        })
      }
    })

    console.log(`  ✅ 食べログから ${reviews.length} 件のデート関連レビューを抽出しました。`)

  } catch (error) {
    console.error(`  ❌ 食べログのスクレイピングエラー (${restaurantName}):`, error)
  } finally {
    await browser.close()
  }

  return reviews
}

// 東京カレンダーからレビューを取得（プレースホルダー）
async function scrapeTokyoCalendarReviews(restaurantName: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const searchQuery = encodeURIComponent(restaurantName)
    const searchUrl = `https://gourmet-calendar.com/search?q=${searchQuery}`

    console.log(`  🔍 グルカレで検索: ${searchUrl}`)
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    // TODO: 東京カレンダーのHTML構造に合わせてスクレイピングロジックを実装
    console.log(`  ⚠️  グルカレで店舗が見つかりませんでした`)
  } catch (error) {
    console.error(`  ❌ 東京カレンダーのスクレイピングエラー (${restaurantName}):`, error)
  } finally {
    await browser.close()
  }

  return reviews
}

// グルナビからレビューを取得（プレースホルダー）
async function scrapeGurunaviReviews(restaurantName: string): Promise<ExternalReview[]> {
  const reviews: ExternalReview[] = []
  // TODO: グルナビのスクレイピングロジックを実装
  return reviews
}

// レビューをデータベースに追加
async function addReviewToDatabase(review: ExternalReview, restaurantId: string): Promise<boolean> {
  try {
    // 正規化されたレビューテキスト（重複チェック用）
    const normalizedText = review.reviewText
      .replace(/\s+/g, '')
      .toLowerCase()

    // 重複チェック（同じ店舗で同じようなレビューがないか）
    const existingReview = await prisma.reviews.findFirst({
      where: {
        restaurant_id: restaurantId,
        review_text: {
          contains: review.reviewText.substring(0, 50), // 最初の50文字で部分一致チェック
        },
      },
    })

    if (existingReview) {
      // 正規化されたテキストで完全一致チェック
      const existingNormalized = existingReview.review_text
        .replace(/\s+/g, '')
        .toLowerCase()

      if (existingNormalized === normalizedText) {
        console.log(`  ⚠️  重複レビューをスキップ: ${review.reviewText.substring(0, 30)}...`)
        return false
      }
    }

    // レビューを追加
    await prisma.reviews.create({
      data: {
        id: randomUUID(),
        restaurant_id: restaurantId,
        user_id: null, // 外部レビューはuser_idをnullに
        rating: review.rating,
        date_appropriateness: 4,
        review_text: review.reviewText,
        updated_at: new Date(),
      },
    })

    console.log(`  📊 追加したレビュー: ${review.reviewText.substring(0, 50)}... (評価: ${review.rating})`)
    return true
  } catch (error) {
    console.error(`  ❌ レビューの追加エラー:`, error)
    return false
  }
}

async function main() {
  console.log('🌱 外部レビューサイトからデート関連のレビューを取得・リライト・追加します...')

  try {
    // テストモード: 環境変数で制御
    const TEST_MODE = process.env.TEST_MODE === 'true'
    const LIMIT = TEST_MODE ? 5 : undefined

    // レストラン一覧を取得
    const restaurants = await prisma.restaurants.findMany({
      take: LIMIT,
      select: {
        id: true,
        name: true,
        area: true,
        address: true,
      },
    })

    console.log(`📊 処理対象レストラン数: ${restaurants.length}件`)
    if (TEST_MODE) {
      console.log(`🧪 テストモード: 最初の${LIMIT}件のみ処理します`)
    }

    let totalReviews = 0
    let skippedReviews = 0

    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i]
      console.log(`\n[${i + 1}/${restaurants.length}] ${restaurant.name}`)

      // 食べログからレビューを取得
      console.log(`  📖 食べログからレビューを取得中...`)
      const tabelogReviews = await scrapeTabelogReviews(restaurant.name, restaurant.area, restaurant.address, (restaurant as any).tabelog_url)
      console.log(`  ✅ 食べログ: ${tabelogReviews.length}件のデート関連レビューを取得`)

      // 東京カレンダーからレビューを取得
      console.log(`  📖 東京カレンダーからレビューを取得中...`)
      const tokyoCalendarReviews = await scrapeTokyoCalendarReviews(restaurant.name)
      console.log(`  ✅ 東京カレンダー: ${tokyoCalendarReviews.length}件のデート関連レビューを取得`)

      // グルナビからレビューを取得
      console.log(`  📖 グルナビからレビューを取得中...`)
      const gurunaviReviews = await scrapeGurunaviReviews(restaurant.name)
      console.log(`  ✅ グルナビ: ${gurunaviReviews.length}件のデート関連レビューを取得`)

      // 全てのレビューをマージ
      const allReviews = [...tabelogReviews, ...tokyoCalendarReviews, ...gurunaviReviews]
      console.log(`  📊 合計: ${allReviews.length}件のデート関連レビューを取得`)

      // レビューをリライトしてデータベースに追加
      for (const review of allReviews) {
        // リライト
        const rewrittenText = await rewriteReview(review.reviewText, restaurant.name)
        review.reviewText = rewrittenText

        // データベースに追加
        const added = await addReviewToDatabase(review, restaurant.id)
        if (added) {
          totalReviews++
        } else {
          skippedReviews++
        }
      }
    }

    console.log(`\n✅ 処理完了`)
    console.log(`📊 処理したレストラン数: ${restaurants.length}件`)
    console.log(`📊 追加したレビュー数: ${totalReviews}件`)
    console.log(`📊 スキップしたレビュー数: ${skippedReviews}件`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
