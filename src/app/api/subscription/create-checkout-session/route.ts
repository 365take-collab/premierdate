import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { PlanType } from '@prisma/client'

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
        stripe_customer_id: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Stripe Customer IDが存在しない場合は作成
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // データベースに保存
      await prisma.users.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      })
    }

    // Price IDを取得
    const priceId = planType === PlanType.PREMIUM_MONTHLY
      ? STRIPE_PRICE_IDS.PREMIUM_MONTHLY
      : STRIPE_PRICE_IDS.PREMIUM_YEARLY

    // ベースURLを取得
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Stripe Checkout Sessionを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId: user.id,
        planType: planType,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planType: planType,
        },
      },
    })

    return NextResponse.json(
      {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Checkout Sessionの作成に失敗しました' },
      { status: 500 }
    )
  }
}
