import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// パスワード設定用のトークンを生成するAPI
export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json()

    // トークン検証モード
    if (token && password) {
      // トークンを検証
      const verificationToken = await prisma.verification_tokens.findFirst({
        where: {
          token,
          expires: { gt: new Date() },
        },
      })

      if (!verificationToken) {
        return NextResponse.json(
          { error: 'トークンが無効または期限切れです' },
          { status: 400 }
        )
      }

      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 10)

      // ユーザーのパスワードを更新
      await prisma.users.update({
        where: { email: verificationToken.identifier },
        data: {
          password: hashedPassword,
          email_verified: new Date(),
          updated_at: new Date(),
        },
      })

      // トークンを削除
      await prisma.verification_tokens.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'パスワードが設定されました',
      })
    }

    // トークン生成モード（メールアドレスのみ）
    if (email) {
      // ユーザーを確認
      const user = await prisma.users.findUnique({
        where: { email },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        )
      }

      // トークンを生成
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

      // TODO: メールを送信
      // const resetUrl = `${process.env.NEXTAUTH_URL}/set-password?token=${token}`
      // await sendEmail(email, 'パスワード設定', `パスワード設定はこちら: ${resetUrl}`)

      return NextResponse.json({
        success: true,
        message: 'パスワード設定リンクを送信しました',
        // 開発用：トークンを返す（本番では削除）
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      })
    }

    return NextResponse.json(
      { error: '必要なパラメータが不足しています' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
