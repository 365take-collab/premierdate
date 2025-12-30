import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// お気に入り状態の確認
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ isFavorite: false }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: '店舗IDが必要です' },
        { status: 400 }
      )
    }

    // お気に入り状態を確認
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
      },
    })

    return NextResponse.json(
      { isFavorite: !!favorite },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking favorite:', error)
    return NextResponse.json(
      { error: 'お気に入り状態の確認に失敗しました' },
      { status: 500 }
    )
  }
}

