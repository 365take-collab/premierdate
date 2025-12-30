import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import OpenAI from 'openai'

// PrismaClientの初期化
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

const prisma = createPrismaClient()

// OpenAI APIキーの設定
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} else {
  console.error('❌ OPENAI_API_KEYが設定されていません。.envファイルに追加してください。')
  process.exit(1)
}

/**
 * レビューテキストをリライト
 */
async function rewriteReview(text: string): Promise<string> {
  if (!openai) {
    return text
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはデートガイドサイトのレビューライターです。外部レビューサイトのレビューを、デートガイドサイト向けに自然にリライトしてください。デートの雰囲気や体験を強調しつつ、元のレビューの内容を保持してください。リライト後のテキストのみを返してください（説明や前置きは不要です）。',
        },
        {
          role: 'user',
          content: `以下のレビューをデートガイドサイト向けにリライトしてください。デートの雰囲気や体験を強調しつつ、自然な日本語で書いてください。\n\n元のレビュー:\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || text
  } catch (error) {
    console.error('  ❌ リライトエラー:', error)
    return text // エラー時は元のテキストを返す
  }
}

/**
 * 既存のレビューをリライト
 */
async function rewriteExistingReviews() {
  console.log('🌱 既存のレビューをリライトします...')

  const TEST_MODE = process.env.TEST_MODE === 'true'
  const limit = TEST_MODE ? 10 : undefined

  // user_idがnullのレビュー（外部レビュー）を取得
  const reviews = await prisma.reviews.findMany({
    where: {
      user_id: null, // 外部レビューのみ
    },
    include: {
      restaurants: {
        select: {
          name: true,
        },
      },
    },
    take: limit,
    orderBy: {
      created_at: 'desc',
    },
  })

  console.log(`📊 リライト対象レビュー数: ${reviews.length}件`)
  if (TEST_MODE) {
    console.log('🧪 テストモード: 最初の10件のみ処理します')
  }

  let processedCount = 0
  let successCount = 0
  let errorCount = 0

  for (const review of reviews) {
    processedCount++
    console.log(`\n[${processedCount}/${reviews.length}] ${review.restaurants.name}`)
    console.log(`  元のレビュー: ${review.review_text.substring(0, 100)}...`)

    try {
      // リライト
      const rewrittenText = await rewriteReview(review.review_text)
      
      if (rewrittenText === review.review_text) {
        console.log(`  ⚠️  リライトされませんでした（元のテキストと同じ）`)
        continue
      }

      console.log(`  ✅ リライト後: ${rewrittenText.substring(0, 100)}...`)

      // データベースを更新
      await prisma.reviews.update({
        where: {
          id: review.id,
        },
        data: {
          review_text: rewrittenText,
          updated_at: new Date(),
        },
      })

      successCount++
      console.log(`  💾 データベースを更新しました`)

      // APIレート制限対策（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      errorCount++
      console.error(`  ❌ エラー:`, error)
    }
  }

  console.log(`\n✅ 処理完了`)
  console.log(`📊 処理したレビュー数: ${processedCount}件`)
  console.log(`📊 成功: ${successCount}件`)
  console.log(`📊 エラー: ${errorCount}件`)
  console.log(`📊 スキップ: ${processedCount - successCount - errorCount}件`)
}

rewriteExistingReviews()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
