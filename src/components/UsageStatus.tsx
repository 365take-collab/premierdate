'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface UsageData {
  favorites: {
    current: number
    limit: number
    remaining: number
  }
  reviewsPerMonth: {
    current: number
    limit: number
    remaining: number
  }
  dateCourses: {
    current: number
    limit: number
    remaining: number
  }
  planType: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
}

export default function UsageStatus() {
  const { data: session } = useSession()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    fetchUsage()
  }, [session])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/user/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session || loading || !usage) {
    return null
  }

  const isPremium = usage.planType === 'PREMIUM_MONTHLY' || usage.planType === 'PREMIUM_YEARLY'

  if (isPremium) {
    return null // プレミアムユーザーは制限がないので表示しない
  }

  const formatLimit = (limit: number) => {
    return limit === Infinity ? '無制限' : limit.toString()
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === Infinity) return 0
    return Math.min(100, (current / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">使用状況（無料プラン）</h3>
        <Link
          href="/subscription"
          className="text-sm text-yellow-400 hover:text-yellow-300 underline"
        >
          プレミアムプランにアップグレード
        </Link>
      </div>

      <div className="space-y-4">
        {/* お気に入り */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">お気に入り</span>
            <span className="text-gray-400">
              {usage.favorites.current} / {formatLimit(usage.favorites.limit)}件
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.favorites.current, usage.favorites.limit))}`}
              style={{ width: `${getUsagePercentage(usage.favorites.current, usage.favorites.limit)}%` }}
            />
          </div>
        </div>

        {/* レビュー投稿 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">レビュー投稿（今月）</span>
            <span className="text-gray-400">
              {usage.reviewsPerMonth.current} / {formatLimit(usage.reviewsPerMonth.limit)}件
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.reviewsPerMonth.current, usage.reviewsPerMonth.limit))}`}
              style={{ width: `${getUsagePercentage(usage.reviewsPerMonth.current, usage.reviewsPerMonth.limit)}%` }}
            />
          </div>
        </div>

        {/* デートコース提案 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">デートコース提案</span>
            <span className="text-gray-400">
              {usage.dateCourses.current} / {formatLimit(usage.dateCourses.limit)}件
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.dateCourses.current, usage.dateCourses.limit))}`}
              style={{ width: `${getUsagePercentage(usage.dateCourses.current, usage.dateCourses.limit)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

