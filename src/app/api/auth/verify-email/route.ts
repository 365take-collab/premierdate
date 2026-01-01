import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: 'トークンとメールアドレスが必要です' },
        { status: 400 }
      )
    }

    // トークンを検証
    const verificationToken = await prisma.verification_tokens.findFirst({
      where: {
        token,
        identifier: email,
        expires: { gt: new Date() },
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 400 }
      )
    }

    // ユーザーが既に存在するか確認
    let user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      // 新規ユーザーを作成（パスワードなし）
      const now = new Date()
      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email,
          email_verified: now,
          name: null,
          updated_at: now,
        },
      })
    } else {
      // 既存ユーザーの場合、メール認証を更新
      await prisma.users.update({
        where: { email },
        data: {
          email_verified: new Date(),
        },
      })
    }

    // トークンを削除
    await prisma.verification_tokens.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    })

    // セッション用の一時トークンを生成（JWTで使用）
    // 実際のログインはフロントエンドで行う
    return NextResponse.json({
      success: true,
      message: 'メールアドレスが確認されました',
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
