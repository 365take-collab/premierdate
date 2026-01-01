import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'
import crypto from 'crypto'

// 定数時間比較（タイミングアタック対策）
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// Utageからの決済完了Webhookを受け取るAPI
// UtageのWebhook設定: https://help.utage-system.com/archives/6789

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Webhookのシークレットキーで認証
    // 本番環境では必須、開発環境ではオプション
    const isDevelopment = process.env.NODE_ENV === 'development'
    const webhookSecret = process.env.UTAGE_WEBHOOK_SECRET
    const signature = request.headers.get('x-utage-signature')
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      // 定数時間比較（タイミングアタック対策）
      const isValid = constantTimeEquals(signature, expectedSignature)
      if (!isValid) {
        console.error('Utage Webhook signature verification failed')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else if (!isDevelopment) {
      // 本番環境では署名検証が必須
      console.error('Utage Webhook signature verification is required in production')
      return NextResponse.json(
        { error: 'Webhook signature is required' },
        { status: 401 }
      )
    }

    console.log('Utage Webhook received:', JSON.stringify(body, null, 2))

    // Utageからのデータを取得
    // 注意: Utageの実際のWebhookペイロード形式に合わせて調整が必要
    // UtageのWebhook形式: https://help.utage-system.com/archives/6789
    const {
      email,
      name,
      product_name,
      product_id,
      order_id,
      payment_status,
      subscription_type, // 'monthly' or 'yearly'
      utage_customer_id,
      // Utageの実際のWebhook形式に合わせて追加
      status, // 'completed', 'canceled', 'refunded' など
      amount,
      currency,
      customer_email,
      customer_name,
    } = body

    // メールアドレスの取得（複数の形式に対応）
    const userEmail = email || customer_email
    const userName = name || customer_name

    // 決済状況を確認
    // UtageのWebhook形式に合わせて、status または payment_status を確認
    const isCompleted = 
      payment_status === 'completed' || 
      payment_status === 'succeeded' ||
      status === 'completed' ||
      status === 'succeeded'
    
    const isCanceled = 
      payment_status === 'canceled' || 
      payment_status === 'cancelled' ||
      status === 'canceled' ||
      status === 'cancelled'
    
    const isRefunded = 
      payment_status === 'refunded' ||
      status === 'refunded'

    // キャンセルまたは返金の場合の処理
    if (isCanceled || isRefunded) {
      console.log('Payment canceled or refunded, deactivating subscription:', { 
        payment_status, 
        status, 
        email: userEmail 
      })

      // ユーザーを検索
      const user = await prisma.users.findUnique({
        where: { email: userEmail },
      })

      if (user) {
        // プランをFREEに変更し、サブスクリプションを即座に終了
        const now = new Date()
        await prisma.users.update({
          where: { email: userEmail },
          data: {
            plan_type: PlanType.FREE,
            subscription_end_date: now, // 即座に終了
            updated_at: now,
          },
        })
        console.log('Subscription deactivated via Utage:', {
          email: userEmail,
          reason: isCanceled ? 'canceled' : 'refunded',
        })
        return NextResponse.json({
          received: true,
          action: 'subscription_deactivated',
          userId: user.id,
          reason: isCanceled ? 'canceled' : 'refunded',
        })
      } else {
        console.log('User not found for cancellation/refund:', userEmail)
        return NextResponse.json({ received: true, action: 'skipped', reason: 'user_not_found' })
      }
    }

    // 決済完了以外の場合はスキップ
    if (!isCompleted) {
      console.log('Payment not completed, skipping:', { payment_status, status })
      return NextResponse.json({ received: true, action: 'skipped' })
    }

    // メールアドレスが必須
    if (!userEmail) {
      console.error('Email is required', { body })
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // プランタイプを決定
    let planType: PlanType = PlanType.PREMIUM_MONTHLY
    if (subscription_type === 'yearly' || product_name?.includes('年額')) {
      planType = PlanType.PREMIUM_YEARLY
    }

    // サブスクリプション期間を設定
    const now = new Date()
    const subscriptionEndDate = new Date(now)
    if (planType === PlanType.PREMIUM_YEARLY) {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
    }

    // 既存ユーザーを確認
    let user = await prisma.users.findUnique({
      where: { email: userEmail },
    })

    if (user) {
      // 既存ユーザーの場合、プランをアップグレード
      user = await prisma.users.update({
        where: { email: userEmail },
        data: {
          plan_type: planType,
          subscription_start_date: now,
          subscription_end_date: subscriptionEndDate,
          updated_at: now,
        },
      })
      console.log('User upgraded via Utage:', user.id, planType, {
        email: userEmail,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
      })
    } else {
      // 新規ユーザーの場合、アカウント作成（パスワードなし）
      // Utage経由の登録なので、メール認証でログインできるようにする
      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email: userEmail,
          name: userName || null,
          password: null, // Utage経由の場合はパスワードなし
          plan_type: planType,
          subscription_start_date: now,
          subscription_end_date: subscriptionEndDate,
          email_verified: now, // Utage経由なのでメール認証済み
          updated_at: now,
        },
      })
      console.log('New user created via Utage:', user.id, planType, {
        email: userEmail,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
      })
    }

    return NextResponse.json({
      received: true,
      action: user ? 'user_created_or_upgraded' : 'skipped',
      userId: user?.id,
      planType,
    })

  } catch (error) {
    console.error('Utage Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    )
  }
}

// Webhookの検証用（GET）
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Utage Webhook endpoint is ready',
    endpoint: '/api/webhooks/utage',
  })
}
