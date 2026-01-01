import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// メール送信の設定（環境変数から取得、なければ開発用の設定）
const getEmailTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }
  // 開発環境用：メール送信しない（コンソールに出力）
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // 既に登録されている場合は、ログインリンクを送信
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setHours(expires.getHours() + 24) // 24時間有効

      await prisma.verification_tokens.deleteMany({
        where: { identifier: email },
      })

      await prisma.verification_tokens.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

      const transporter = getEmailTransporter()
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@premierdate.jp',
          to: email,
          subject: 'プレミアデート - ログインリンク',
          html: `
            <h2>プレミアデートへようこそ</h2>
            <p>以下のリンクをクリックしてログインしてください：</p>
            <p><a href="${loginUrl}">${loginUrl}</a></p>
            <p>このリンクは24時間有効です。</p>
          `,
        })
      } else {
        // 開発環境：コンソールに出力
        console.log('📧 メール送信（開発環境）:')
        console.log(`To: ${email}`)
        console.log(`Subject: プレミアデート - ログインリンク`)
        console.log(`URL: ${loginUrl}`)
      }

      return NextResponse.json({
        success: true,
        message: '既に登録されているメールアドレスです。ログインリンクを送信しました。',
        // 開発用：トークンを返す
        token: process.env.NODE_ENV === 'development' ? token : undefined,
        url: process.env.NODE_ENV === 'development' ? loginUrl : undefined,
      })
    }

    // 新規ユーザーの場合、メール認証トークンを生成
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24時間有効

    // 既存のトークンを削除
    await prisma.verification_tokens.deleteMany({
      where: { identifier: email },
    })

    // 新しいトークンを作成
    await prisma.verification_tokens.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const transporter = getEmailTransporter()
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@premierdate.jp',
        to: email,
        subject: 'プレミアデート - メールアドレス確認',
        html: `
          <h2>プレミアデートへようこそ</h2>
          <p>以下のリンクをクリックして登録を完了してください：</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>このリンクは24時間有効です。</p>
        `,
      })
    } else {
      // 開発環境：コンソールに出力
      console.log('📧 メール送信（開発環境）:')
      console.log(`To: ${email}`)
      console.log(`Subject: プレミアデート - メールアドレス確認`)
      console.log(`URL: ${verifyUrl}`)
    }

    return NextResponse.json({
      success: true,
      message: 'メールアドレス確認リンクを送信しました。メールをご確認ください。',
      // 開発用：トークンを返す
      token: process.env.NODE_ENV === 'development' ? token : undefined,
      url: process.env.NODE_ENV === 'development' ? verifyUrl : undefined,
    })
  } catch (error) {
    console.error('Register email error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
