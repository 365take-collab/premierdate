import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // ユーザーのプラン情報を取得
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        plan_type: true,
        subscription_start_date: true,
        subscription_end_date: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりませんでした' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      planType: user.plan_type,
      subscriptionStartDate: user.subscription_start_date,
      subscriptionEndDate: user.subscription_end_date,
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user plan:', error)
    return NextResponse.json(
      { error: 'プラン情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}



