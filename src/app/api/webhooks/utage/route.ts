import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PlanType } from '@prisma/client'
import crypto from 'crypto'

// Utageからの決済完了Webhookを受け取るAPI
// UtageのWebhook設定: https://help.utage-system.com/archives/6789

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Webhookのシークレットキーで認証（オプション）
    const webhookSecret = process.env.UTAGE_WEBHOOK_SECRET
    const signature = request.headers.get('x-utage-signature')
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (signature !== expectedSignature) {
        console.error('Utage Webhook signature verification failed')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    console.log('Utage Webhook received:', JSON.stringify(body, null, 2))

    // Utageからのデータを取得
    // 注意: Utageの実際のWebhookペイロード形式に合わせて調整が必要
    const {
      email,
      name,
      product_name,
      product_id,
      order_id,
      payment_status,
      subscription_type, // 'monthly' or 'yearly'
      utage_customer_id,
    } = body

    // 決済完了の場合のみ処理
    if (payment_status !== 'completed' && payment_status !== 'succeeded') {
      console.log('Payment not completed, skipping:', payment_status)
      return NextResponse.json({ received: true, action: 'skipped' })
    }

    // メールアドレスが必須
    if (!email) {
      console.error('Email is required')
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
      where: { email },
    })

    if (user) {
      // 既存ユーザーの場合、プランをアップグレード
      user = await prisma.users.update({
        where: { email },
        data: {
          plan_type: planType,
          subscription_start_date: now,
          subscription_end_date: subscriptionEndDate,
          updated_at: now,
        },
      })
      console.log('User upgraded:', user.id, planType)
    } else {
      // 新規ユーザーの場合、アカウント作成
      // 一時パスワードを生成（ユーザーには後でリセットしてもらう）
      const tempPassword = crypto.randomBytes(16).toString('hex')
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name: name || null,
          password: hashedPassword,
          plan_type: planType,
          subscription_start_date: now,
          subscription_end_date: subscriptionEndDate,
          updated_at: now,
        },
      })
      console.log('New user created:', user.id, planType)

      // TODO: パスワード設定メールを送信する
      // 今後の実装: SendGridやAWS SESでメール送信
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
