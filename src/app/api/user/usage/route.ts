import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanType } from '@/lib/user-plan'
import { getUsageLimits, getRemainingQuota } from '@/lib/usage-limits'

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

    // プランタイプを取得
    const planType = await getUserPlanType()
    if (!planType) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // お気に入り数
    const favoriteCount = await prisma.favorite.count({
      where: {
        userId: session.user.id,
      },
    })

    // 今月のレビュー投稿数
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const reviewCount = await prisma.review.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    // デートコース提案数
    const dateCourseCount = await prisma.dateCourse.count({
      where: {
        userId: session.user.id,
      },
    })

    const limits = getUsageLimits(planType)
    
    const usage = {
      favorites: {
        current: favoriteCount,
        limit: limits.favorites,
        remaining: getRemainingQuota(planType, 'favorites', favoriteCount),
      },
      reviewsPerMonth: {
        current: reviewCount,
        limit: limits.reviewsPerMonth,
        remaining: getRemainingQuota(planType, 'reviewsPerMonth', reviewCount),
      },
      dateCourses: {
        current: dateCourseCount,
        limit: limits.dateCourses,
        remaining: getRemainingQuota(planType, 'dateCourses', dateCourseCount),
      },
    }

    return NextResponse.json({ usage, planType }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json(
      { error: '使用状況の取得に失敗しました' },
      { status: 500 }
    )
  }
}

