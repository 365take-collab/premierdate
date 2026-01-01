import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'

/**
 * Utage決済ページへのリダイレクトURLを生成
 * 
 * Utageの決済ページURLは環境変数で設定します。
 * 例: UTAGE_CHECKOUT_URL_MONTHLY=https://utage.jp/checkout/monthly
 *     UTAGE_CHECKOUT_URL_YEARLY=https://utage.jp/checkout/yearly
 */
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

    const { planType } = await request.json()

    // バリデーション
    if (!planType || !['PREMIUM_MONTHLY', 'PREMIUM_YEARLY'].includes(planType)) {
      return NextResponse.json(
        { error: '有効なプランタイプを指定してください' },
        { status: 400 }
      )
    }

    // ユーザー情報を取得
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Utageの決済ページURLを取得（環境変数から）
    const utageCheckoutUrl = planType === PlanType.PREMIUM_MONTHLY
      ? process.env.UTAGE_CHECKOUT_URL_MONTHLY
      : process.env.UTAGE_CHECKOUT_URL_YEARLY

    if (!utageCheckoutUrl) {
      console.error('Utage checkout URL not configured:', { planType })
      return NextResponse.json(
        { 
          error: 'Utage決済ページのURLが設定されていません。管理者にお問い合わせください。',
          details: 'UTAGE_CHECKOUT_URL_MONTHLY または UTAGE_CHECKOUT_URL_YEARLY を環境変数に設定してください'
        },
        { status: 500 }
      )
    }

    // Utageの決済ページURLにメールアドレスをパラメータとして追加
    // Utageの%mail%変数を使用する場合、URLパラメータで渡す
    const checkoutUrl = new URL(utageCheckoutUrl)
    checkoutUrl.searchParams.set('email', user.email || '')
    checkoutUrl.searchParams.set('user_id', user.id)
    
    // 成功後のリダイレクト先（Utageのサンクスページから戻るURL）
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'
    const successUrl = `${baseUrl}/subscription/success`
    checkoutUrl.searchParams.set('success_url', successUrl)

    return NextResponse.json(
      {
        url: checkoutUrl.toString(),
        planType,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating Utage checkout URL:', error)
    return NextResponse.json(
      { error: 'Utage決済ページのURL生成に失敗しました' },
      { status: 500 }
    )
  }
}
