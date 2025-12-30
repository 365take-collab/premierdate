import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanType, getUserId } from '@/lib/user-plan'
import { getUsageLimits, hasReachedLimit } from '@/lib/usage-limits'

// お気に入り一覧取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    // お気に入り一覧を取得
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        restaurant: {
          include: {
            restaurantPurposes: {
              include: {
                purposeCategory: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 平均評価を計算して追加
    const favoritesWithRating = await Promise.all(
      favorites.map(async (favorite) => {
        const avgRating = await prisma.review.aggregate({
          where: {
            restaurantId: favorite.restaurant.id,
            isPremiumOnly: false,
          },
          _avg: {
            rating: true,
          },
        })
        return {
          ...favorite,
          restaurant: {
            ...favorite.restaurant,
            avgRating: avgRating._avg.rating || 0,
          },
        }
      })
    )

    return NextResponse.json({ favorites: favoritesWithRating }, { status: 200 })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'お気に入りの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// お気に入り追加
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { restaurantId } = await request.json()

    if (!restaurantId) {
      return NextResponse.json(
        { error: '店舗IDが必要です' },
        { status: 400 }
      )
    }

    // 店舗が存在するか確認
    const restaurant = await prisma.restaurants.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: '店舗が見つかりませんでした' },
        { status: 404 }
      )
    }

    // 既にお気に入りに追加されているか確認
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
      },
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: '既にお気に入りに追加されています' },
        { status: 400 }
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

    // お気に入り数の制限チェック
    const currentFavoriteCount = await prisma.favorite.count({
      where: {
        userId: session.user.id,
      },
    })

    if (hasReachedLimit(planType, 'favorites', currentFavoriteCount)) {
      const limits = getUsageLimits(planType)
      return NextResponse.json(
        { 
          error: `無料プランではお気に入りは${limits.favorites}件までです。プレミアムプランにアップグレードすると無制限にご利用いただけます。`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // お気に入りを追加
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        restaurantId: restaurantId,
      },
    })

    return NextResponse.json(
      { message: 'お気に入りに追加しました', favorite },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'お気に入りの追加に失敗しました' },
      { status: 500 }
    )
  }
}

// お気に入り削除
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: '店舗IDが必要です' },
        { status: 400 }
      )
    }

    // お気に入りを削除
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
      },
    })

    if (!favorite) {
      return NextResponse.json(
        { error: 'お気に入りが見つかりませんでした' },
        { status: 404 }
      )
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    })

    return NextResponse.json(
      { message: 'お気に入りから削除しました' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'お気に入りの削除に失敗しました' },
      { status: 500 }
    )
  }
}
