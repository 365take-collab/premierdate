import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'
import { PlanType } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // PrismaアダプターはOAuth/Email認証用（Credentials認証では使用しない）
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // メール/パスワード認証（開発用）
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' }, // メール認証トークン用
        utageToken: { label: 'Utage Token', type: 'text' }, // Utage認証トークン用
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Utage認証トークンでのログイン（パスワード不要）
        if (credentials.utageToken) {
          // Utage経由の認証の場合、ユーザーが存在し、課金が有効であることを確認
          const user = await prisma.users.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          // 課金状況を確認（Utage APIで既に確認済みだが、念のため再確認）
          const now = new Date()
          const isSubscriptionActive = 
            user.plan_type !== PlanType.FREE &&
            user.subscription_end_date &&
            user.subscription_end_date > now

          if (!isSubscriptionActive) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }

        // メール認証トークンでのログイン
        if (credentials.token) {
          const verificationToken = await prisma.verification_tokens.findFirst({
            where: {
              token: credentials.token,
              identifier: credentials.email,
              expires: { gt: new Date() },
            },
          })

          if (!verificationToken) {
            return null
          }

          const user = await prisma.users.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }

        // パスワード認証
        if (!credentials.password) {
          return null
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    }),
    // メール認証（本番用 - マジックリンク、オプション）
    ...(process.env.SMTP_HOST ? [
      EmailProvider({
        server: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        },
        from: process.env.SMTP_FROM || 'noreply@dateguide.jp',
      })
    ] : []),
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    verifyRequest: '/login?verifyRequest=true',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        
        // ユーザーのプラン情報を取得
        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          select: { plan_type: true }
        })
        
        if (dbUser) {
          token.planType = dbUser.plan_type
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.planType = token.planType as PlanType
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
}

