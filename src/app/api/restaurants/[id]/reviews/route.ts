import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanType } from '@/lib/user-plan'
import { getUsageLimits, hasReachedLimit } from '@/lib/usage-limits'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { rating, dateAppropriateness, reviewText } = await request.json()

    // バリデーション
    if (!rating || !dateAppropriateness || !reviewText) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5 || dateAppropriateness < 1 || dateAppropriateness > 5) {
      return NextResponse.json(
        { error: '評価は1-5の範囲で入力してください' },
        { status: 400 }
      )
    }

    if (reviewText.length < 10 || reviewText.length > 1000) {
      return NextResponse.json(
        { error: 'レビューテキストは10文字以上1000文字以下で入力してください' },
        { status: 400 }
      )
    }

    // 店舗が存在するか確認
    const restaurant = await prisma.restaurants.findUnique({
      where: { id: params.id },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: '店舗が見つかりませんでした' },
        { status: 404 }
      )
    }

    // プランタイプを取得
    const planType = await getUserPlanType()
    if (!planType) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 今月のレビュー投稿数の制限チェック
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthReviewCount = await prisma.reviews.count({
      where: {
        user_id: session.user.id,
        created_at: {
          gte: startOfMonth,
        },
      },
    })

    if (hasReachedLimit(planType, 'reviewsPerMonth', currentMonthReviewCount)) {
      const limits = getUsageLimits(planType)
      return NextResponse.json(
        { 
          error: `無料プランではレビューは月${limits.reviewsPerMonth}件までです。プレミアムプランにアップグレードすると無制限にご利用いただけます。`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // レビューを作成
    const review = await prisma.reviews.create({
      data: {
        id: crypto.randomUUID(),
        restaurant_id: params.id,
        user_id: session.user.id,
        rating: Number(rating),
        date_appropriateness: Number(dateAppropriateness),
        review_text: reviewText.trim(),
        is_premium_only: false,
        is_anonymous: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'レビューが投稿されました', review },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'レビューの投稿に失敗しました' },
      { status: 500 }
    )
  }
}

