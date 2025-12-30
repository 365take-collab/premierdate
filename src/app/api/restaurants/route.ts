import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPremiumUser } from '@/lib/user-plan'

export async function GET(request: NextRequest) {
  try {
    const isPremium = await isPremiumUser()
    const searchParams = request.nextUrl.searchParams
    const area = searchParams.get('area')
    const priceRange = searchParams.get('priceRange')
    const purpose = searchParams.get('purpose')
    const q = searchParams.get('q') // キーワード検索
    const sort = searchParams.get('sort') || 'default' // ソート順
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 検索条件の構築
    const where: any = {
      is_active: true,
    }

    if (area) {
      where.area = area
    }

    if (priceRange) {
      where.price_range = priceRange
    }

    // 用途でフィルタリング（目的カテゴリ経由）
    if (purpose) {
      where.restaurant_purposes = {
        some: {
          purpose_categories: {
            name: purpose,
          },
        },
      }
    }

    // キーワード検索（店舗名、エリア、説明で検索）
    if (q && q.trim()) {
      const keyword = q.trim()
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { area: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { address: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    // ソート順を決定
    let orderBy: any = { created_at: 'desc' } // デフォルトは新着順
    
    if (sort === 'newest') {
      orderBy = { created_at: 'desc' }
    }

    // 店舗を取得
    let restaurants = await prisma.restaurants.findMany({
      where,
      include: {
        restaurant_purposes: {
          include: {
            purpose_categories: true,
          },
        },
        reviews: isPremium
          ? {
              // プレミアムユーザーはすべてのレビューを見れる
              take: 5, // 最新5件
              orderBy: {
                created_at: 'desc',
              },
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
      orderBy,
      take: sort === 'rating' || sort === 'reviews' ? limit * 2 : limit, // ソートのために多めに取得（パフォーマンス考慮）
      skip: offset,
    })

    // 平均評価を一括で計算（パフォーマンス改善、プレミアムユーザーのみ）
    const restaurantIds = restaurants.map(r => r.id)
    const ratingMap = new Map<string, number>()
    
    if (isPremium && restaurantIds.length > 0) {
      const avgRatings = await prisma.reviews.groupBy({
        by: ['restaurant_id'],
        where: {
          restaurant_id: { in: restaurantIds },
        },
        _avg: {
          rating: true,
        },
      })
      
      // 平均評価をマップに変換
      avgRatings.forEach(avg => {
        ratingMap.set(avg.restaurant_id, avg._avg.rating || 0)
      })
    }

    // 平均評価を追加（プレミアムユーザーのみ）
    restaurants = restaurants.map(restaurant => ({
      ...restaurant,
      reviews: isPremium ? restaurant.reviews : [], // 無料ユーザーは空配列
      avgRating: isPremium ? (ratingMap.get(restaurant.id) || 0) : 0,
      isPremiumUser: isPremium, // フロントエンドで使用
    }))

    // ソート順に応じてソート
    if (sort === 'rating') {
      restaurants.sort((a, b) => {
        const aRating = 'avgRating' in a ? (a as any).avgRating : 0
        const bRating = 'avgRating' in b ? (b as any).avgRating : 0
        return bRating - aRating
      })
    } else if (sort === 'reviews') {
      restaurants.sort((a, b) => b._count.reviews - a._count.reviews)
    }

    // limit分だけ返す
    restaurants = restaurants.slice(0, limit)

    // 総件数を取得
    const total = await prisma.restaurants.count({ where })

    return NextResponse.json({
      restaurants,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

