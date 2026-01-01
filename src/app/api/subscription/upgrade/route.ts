import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'

// Utage決済との連携用のエンドポイント（プレースホルダー）
// 実際のUtage API連携は後で実装

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

    const { planType, paymentToken } = await request.json()

    // バリデーション
    if (!planType || !['PREMIUM_MONTHLY', 'PREMIUM_YEARLY'].includes(planType)) {
      return NextResponse.json(
        { error: '有効なプランタイプを指定してください' },
        { status: 400 }
      )
    }

    // TODO: Utage APIとの連携
    // 1. paymentTokenを使用してUtageで決済を確認
    // 2. 決済が成功した場合、ユーザーのプランを更新
    // 3. 決済情報を保存

    // プレースホルダー: 決済確認は後で実装
    // 現在は直接プランを更新（開発用）
    if (!paymentToken) {
      return NextResponse.json(
        { error: '決済トークンが必要です' },
        { status: 400 }
      )
    }

    // Utage API連携（プレースホルダー）
    // const utageResponse = await verifyPaymentWithUtage(paymentToken)
    // if (!utageResponse.success) {
    //   return NextResponse.json(
    //     { error: '決済の確認に失敗しました' },
    //     { status: 402 }
    //   )
    // }

    // プランを更新
    const now = new Date()
    const subscriptionEndDate = new Date(now)
    
    if (planType === PlanType.PREMIUM_MONTHLY) {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
    } else if (planType === PlanType.PREMIUM_YEARLY) {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
    }

    const user = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        plan_type: planType as PlanType,
        subscription_start_date: now,
        subscription_end_date: subscriptionEndDate,
        // TODO: Utageから取得した顧客IDやサブスクリプションIDを保存
        // utage_customer_id: utageResponse.customerId,
        // utage_subscription_id: utageResponse.subscriptionId,
      },
      select: {
        id: true,
        plan_type: true,
        subscription_start_date: true,
        subscription_end_date: true,
      },
    })

    return NextResponse.json(
      { 
        message: 'プランのアップグレードが完了しました',
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'プランのアップグレードに失敗しました' },
      { status: 500 }
    )
  }
}



