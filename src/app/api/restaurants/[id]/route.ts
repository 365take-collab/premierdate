import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPremiumUser } from '@/lib/user-plan'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isPremium = await isPremiumUser()
    const { id } = await params

    const restaurant = await prisma.restaurants.findUnique({
      where: {
        id: id,
      },
      include: {
        restaurant_purposes: {
          include: {
            purpose_categories: true,
          },
        },
        reviews: isPremium
          ? {
              // プレミアムユーザーはすべてのレビューを見れる
              orderBy: {
                created_at: 'desc',
              },
              take: 20,
            }
          : {
              // 無料ユーザーはレビューを見れない（空配列）
              where: {
                id: 'never-match', // 常にマッチしない条件
              },
              take: 0,
            },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // 平均評価を計算（プレミアムユーザーのみ）
    let avgRating = { _avg: { rating: null as number | null, date_appropriateness: null as number | null } }
    if (isPremium) {
      avgRating = await prisma.reviews.aggregate({
        where: {
          restaurant_id: restaurant.id,
        },
        _avg: {
          rating: true,
          date_appropriateness: true,
        },
      })
    }

    return NextResponse.json({
      ...restaurant,
      reviews: isPremium ? restaurant.reviews : [], // 無料ユーザーは空配列
      avgRating: isPremium ? (avgRating._avg.rating || 0) : 0,
      avgDateAppropriateness: isPremium ? (avgRating._avg.date_appropriateness || 0) : 0,
      isPremiumUser: isPremium, // フロントエンドで使用
    })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    )
  }
}



