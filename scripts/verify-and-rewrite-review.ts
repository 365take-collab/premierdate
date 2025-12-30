import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
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
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// レビューをリライト
async function rewriteReview(originalText: string, restaurantName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたはデートガイドのプロフェッショナルなレビューライターです。

外部サイトから取得した途中で切れているレビューを、デートガイドに適した完全な形式にリライトしてください。

リライトの条件：
1. デート向けの視点で書く
2. 雰囲気や特別な日に適しているかを強調
3. 150-250文字程度にまとめる
4. 元のレビューの内容を尊重しつつ、デート向けに最適化する
5. 途中で切れている部分は、自然に補完する
6. 具体的な情報（料理名、価格帯、時間帯など）は残す
7. デートでの利用シーンを明確にする`,
        },
        {
          role: 'user',
          content: `店舗名: ${restaurantName}

元のレビュー（途中で切れています）:
${originalText}

このレビューを、デートガイドに適した完全な形式にリライトしてください。`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    return response.choices[0]?.message?.content || originalText
  } catch (error) {
    console.error('  ⚠️  リライトエラー:', error)
    return originalText
  }
}

async function main() {
  console.log('🔍 追加したレビューを検証・リライトします...\n')

  try {
    // 最後に追加されたレビューを取得
    const review = await prisma.reviews.findFirst({
      where: {
        user_id: null, // 外部レビュー
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        restaurants: true,
      },
    })

    if (!review) {
      console.log('❌ 外部レビューが見つかりませんでした')
      return
    }

    console.log('📊 追加されたレビュー情報:')
    console.log(`  レビューID: ${review.id}`)
    console.log(`  店舗名: ${review.restaurants.name}`)
    console.log(`  エリア: ${review.restaurants.area}`)
    console.log(`  評価: ${'⭐'.repeat(review.rating)}`)
    console.log(`  デート適性: ${review.date_appropriateness}/5`)
    console.log('')

    console.log('📝 元のレビューテキスト:')
    console.log(`  ${review.review_text}`)
    console.log('')

    // レビューテキストの長さをチェック
    const textLength = review.review_text.length
    console.log(`📏 レビューの長さ: ${textLength}文字`)

    // 途中で切れているかチェック
    const isTruncated = review.review_text.endsWith('...') || textLength < 100
    if (isTruncated) {
      console.log('⚠️  レビューが途中で切れている可能性があります')
    }
    console.log('')

    // 店舗とレビューが合っているか検証
    console.log('🔍 店舗とレビューの整合性チェック:')
    const restaurantKeywords = review.restaurants.name.split(/[\s・]/)[0]
    const reviewMentionsRestaurant = review.review_text.includes(restaurantKeywords)
    
    if (reviewMentionsRestaurant) {
      console.log(`  ✅ レビュー内に店舗名が含まれています（キーワード: ${restaurantKeywords}）`)
    } else {
      console.log(`  ⚠️  レビュー内に店舗名が含まれていません（キーワード: ${restaurantKeywords}）`)
      console.log(`     ※ 一般的なデート体験のレビューの可能性があります`)
    }
    console.log('')

    // リライトを実行
    console.log('✍️  レビューをリライト中...')
    const rewrittenText = await rewriteReview(review.review_text, review.restaurants.name)
    
    console.log('\n📝 リライト後のレビューテキスト:')
    console.log(`  ${rewrittenText}`)
    console.log('')

    console.log('📏 リライト後の長さ:', rewrittenText.length, '文字')
    console.log('')

    // データベースを更新
    console.log('💾 データベースを更新中...')
    await prisma.reviews.update({
      where: {
        id: review.id,
      },
      data: {
        review_text: rewrittenText,
        updated_at: new Date(),
      },
    })

    console.log('✅ レビューを更新しました！')
    console.log('')

    // 更新後のレビューを表示
    console.log('📊 最終的なレビュー:')
    console.log(`  店舗名: ${review.restaurants.name}`)
    console.log(`  評価: ${'⭐'.repeat(review.rating)}`)
    console.log(`  デート適性: ${review.date_appropriateness}/5`)
    console.log(`  レビュー: ${rewrittenText}`)

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
