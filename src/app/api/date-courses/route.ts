import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanType } from '@/lib/user-plan'
import { getUsageLimits, hasReachedLimit } from '@/lib/usage-limits'
import crypto from 'crypto'

// デートコース一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') !== 'false' // デフォルトは公開のみ

    // デートコース一覧を取得
    const where: any = {}
    if (isPublic) {
      where.is_public = true
    }

    // 認証されている場合は自分のコースも含める
    const session = await getServerSession(authOptions)
    if (session && session.user?.id) {
      where.OR = [
        { is_public: true },
        { user_id: session.user.id },
      ]
    } else {
      where.is_public = true
    }

    const dateCourses = await prisma.date_courses.findMany({
      where,
      include: {
        restaurants: {
          include: {
            restaurant_purposes: {
              include: {
                purpose_categories: true,
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
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50, // 最大50件
    })

    return NextResponse.json({ dateCourses }, { status: 200 })
  } catch (error) {
    console.error('Error fetching date courses:', error)
    return NextResponse.json(
      { error: 'デートコースの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// デートコース作成
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

    const { restaurantId, courseName, description, isPublic } = await request.json()

    // バリデーション
    if (!restaurantId || !courseName) {
      return NextResponse.json(
        { error: '店舗IDとコース名は必須です' },
        { status: 400 }
      )
    }

    if (courseName.length < 1 || courseName.length > 100) {
      return NextResponse.json(
        { error: 'コース名は1文字以上100文字以下で入力してください' },
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

    // プランタイプを取得
    const planType = await getUserPlanType()
    if (!planType) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // デートコース提案数の制限チェック
    const currentDateCourseCount = await prisma.date_courses.count({
      where: {
        user_id: session.user.id,
      },
    })

    if (hasReachedLimit(planType, 'dateCourses', currentDateCourseCount)) {
      const limits = getUsageLimits(planType)
      return NextResponse.json(
        { 
          error: `無料プランではデートコース提案は${limits.dateCourses}件までです。プレミアムプランにアップグレードすると無制限にご利用いただけます。`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // デートコースを作成
    const dateCourse = await prisma.date_courses.create({
      data: {
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        user_id: session.user.id,
        course_name: courseName.trim(),
        description: description?.trim() || null,
        is_public: isPublic !== false, // デフォルトは公開
        updated_at: new Date(),
      },
      include: {
        restaurants: {
          include: {
            restaurant_purposes: {
              include: {
                purpose_categories: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'デートコースが作成されました', dateCourse },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating date course:', error)
    return NextResponse.json(
      { error: 'デートコースの作成に失敗しました' },
      { status: 500 }
    )
  }
}

