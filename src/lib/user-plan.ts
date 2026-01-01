// ユーザーのプラン情報を取得するヘルパー関数

import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { PlanType } from '@prisma/client'

export async function getUserPlanType(): Promise<PlanType | null> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { plan_type: true },
  })

  return user?.plan_type || PlanType.FREE
}

export async function isPremiumUser(): Promise<boolean> {
  const planType = await getUserPlanType()
  return planType === PlanType.PREMIUM_MONTHLY || planType === PlanType.PREMIUM_YEARLY
}

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}



