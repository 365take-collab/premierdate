// ユーザーの使用制限を定義・チェックするモジュール

import { PlanType } from '@prisma/client'

export const USAGE_LIMITS = {
  FREE: {
    favorites: 3, // お気に入りは3件まで
    reviewsPerMonth: 5, // レビューは月5件まで
    dateCourses: 1, // デートコース提案は1件まで
  },
  PREMIUM_MONTHLY: {
    favorites: Infinity, // 無制限
    reviewsPerMonth: Infinity,
    dateCourses: Infinity,
  },
  PREMIUM_YEARLY: {
    favorites: Infinity,
    reviewsPerMonth: Infinity,
    dateCourses: Infinity,
  },
} as const

export interface UsageLimits {
  favorites: number
  reviewsPerMonth: number
  dateCourses: number
}

export function getUsageLimits(planType: PlanType): UsageLimits {
  return USAGE_LIMITS[planType]
}

export function hasReachedLimit(
  planType: PlanType,
  feature: 'favorites' | 'reviewsPerMonth' | 'dateCourses',
  currentUsage: number
): boolean {
  const limits = getUsageLimits(planType)
  const limit = limits[feature]
  return limit !== Infinity && currentUsage >= limit
}

export function getRemainingQuota(
  planType: PlanType,
  feature: 'favorites' | 'reviewsPerMonth' | 'dateCourses',
  currentUsage: number
): number {
  const limits = getUsageLimits(planType)
  const limit = limits[feature]
  if (limit === Infinity) {
    return Infinity
  }
  return Math.max(0, limit - currentUsage)
}



